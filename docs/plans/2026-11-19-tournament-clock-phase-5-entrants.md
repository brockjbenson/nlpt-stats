# Tournament Clock Phase 5 (Entrants) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Track who is playing in a clock. The admin adds members and guests, busts players (recording who knocked them out), undoes a bust, rebuys, and edits the payouts. The display shows players left by name, the average stack, the prize pool and each paid place's payout, live.

**Architecture:** Entrants and knockouts are rows in `_clock_entrants` and `_clock_knockouts`. Every screen loads them with the clock and keeps them live over Realtime, the same way phase 4 keeps the clock live: refetch on every (re)subscribe and when the tab becomes visible. The phase 2 rules (`planBust`, `planUndoBust`, `planRebuy`) decide each change and the server actions re-check them. A bust and its undo each go through one database function (`bust_clock_entrant`, `undo_clock_bust`), so the player's place and the knockout row change together. The pool, chips and payouts are worked out on every screen from the rows (`computePool`, `computeChips`, `computePayouts`). Nothing derived is stored.

**Tech Stack:** Next.js 16 (server components, server actions), React 19, Supabase JS (Realtime `postgres_changes`, RPC), shadcn/ui (`Card`, `Sheet`/`Drawer`, `AlertDialog`, `Select`, `Checkbox`, `Input`, `Button`, `Badge`), Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions as in phase 4: thin `app/` routes over `features/clock/{components,hooks,actions,data,lib}`; server actions re-check `getCurrentUser().isAdmin` and return `{ success, message }`; toasts via `useToast`; Supabase writes to **dev only**; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (Entrant actions, Rebuy rules, Payout rule). Phase 4: `docs/plans/2026-11-19-tournament-clock-phase-4-clock-core.md`. Branch: `feat/tournament-shot-clock`.

---

## Decisions made in this plan (confirm before starting)

1. **Knockouts are recorded, optionally.** The bust dialog asks "Knocked out by" (any player still in, or "Not recorded"). The knockout row stays if the busted player rebuys back in; undoing the bust deletes it. The control screen shows each player's knockout count. The display doesn't show knockouts yet: phase 7 or the trinkets work can use them.
2. **Players can be added until the first bust.** A bust's place is "players left", so adding a player after someone is out would give the next bust a place that's already taken. After the first bust, Add players is disabled with a note saying why. (Rebuys still work as usual.)
3. **Players can be removed** while they've never busted and have no knockouts (mistakes at sign-up). The database's foreign keys refuse anything else.
4. **Names:** members show as first name and last initial ("Brock B."), or the full first and last name when two players share both. Guests show the name as typed, up to 40 characters (the database's limit), with a small "Guest" tag on the control screen only.
5. **Rebuy** is one button per player. For a player still in, it adds a rebuy. For the most recent bust, it's a re-entry: their place is cleared and they're back in. Every refusal from `planRebuy` shows as a message: max rebuys, in the money, not the most recent bust, clock not started.
6. **Concurrent screens:** a bust is refused if its place was already taken (the database's unique place per clock) or the player is already out. A rebuy saves only where `rebuys` still equals what the screen saw. Either way the message is "The players changed on another screen. Try again." Undo is checked by the app; two undos at once are unlikely and harmless (the second is refused as no longer the most recent).
7. **Payouts can be edited on the control screen** (places paid and the split) until the clock finishes, reusing the phase 4 payout fields in a sheet.
8. **Adding players works in any status but finished**, including before Start, so sign-up can happen while people arrive.
9. **Display layout:** the clock stays the main thing. A side panel (landscape) or bottom panel (portrait) shows Players left N/M with names, Avg stack, Pool, and the payouts. On a phone in portrait the names fold into a count if they don't fit.

## Ground rules

- Dev only (`supabase-dev`). Prod gets the knockouts migration with the rest of the clock migrations (phase 4's Task 10), only with the user's go-ahead.
- Pure logic in `features/clock/lib/`, tests next to it.
- The other computer may hold unpushed phase 5 work. Pull before starting each session; if it shows up, stop and reconcile before going on.

## Facts (checked 2026-11-20)

- Dev has `20261120043702_tournament_clock_knockouts` applied; the repo file matches it (saved from dev's migration history). Prod has none of the clock migrations.
- The migration adds `_clock_knockouts` (`clock_id`, `entrant_id`, `knocked_out_by` nullable, `busted_at`; same-clock foreign keys; not self), RLS (anyone reads, admins write), Realtime with `replica identity full`, a unique `(clock_id, id)` on entrants, a 40-character guest name check, and two `security invoker` functions:
  - `bust_clock_entrant(p_entrant_id, p_finish_place, p_busted_at, p_knocked_out_by) returns _clock_entrants`: sets the place and adds the knockout row; `no_data_found` when the player is already out or missing; `unique_violation` when another bust took the place.
  - `undo_clock_bust(p_entrant_id) returns _clock_entrants`: clears the place and deletes the newest knockout row; `no_data_found` when the player isn't out.
- `_clock_entrants` (phase 1): exactly one of `member_id` / `guest_name`; a member at most once per clock; `busted_at` and `finish_place` set together; unique `finish_place` per clock. It's in the Realtime publication with `replica identity full`.
- Phase 2 rules in `features/clock/lib/entrants.ts`: `playersLeft`, `planBust` (`not_found`, `already_busted`, `last_player`), `planUndoBust` (`not_found`, `not_busted`, `not_most_recent`), `planRebuy` (`not_found`, `wrong_status`, `max_rebuys`, `not_most_recent`, `in_the_money`), `planFinish`. Money in `money.ts`: `totalRebuys`, `computePool`, `computeChips`, `lastPlacePct`, `computePayouts`.
- Phase 4: `useClock` (`features/clock/hooks/use-clock.ts`) subscribes with `subscribeToClock` and refetches on (re)subscribe and on `visibilitychange`; `mergeClockRow` in `data/clocks.ts` merges partial Realtime rows. The control screen is `features/clock/components/control/clock-controls.tsx`; the display is `components/display/clock-display.tsx` with `clock-face.tsx`. `PayoutFields` and `settingsReducer` were generalized for the create form.
- Members: `members` table (`id`, `first_name`, `last_name`, `nickname`, `portrait_url`, `visible`), type `Member` in `utils/types.ts`; readable by anon on dev and prod.
- Dev has two clocks and no entrants.

---

### Task 1: Knockouts migration (already on dev)

**Files:**
- Create: `supabase/migrations/20261120043702_tournament_clock_knockouts.sql` (done: saved from dev, matches what was applied)
- Add `ClockKnockout` to `features/clock/types.ts`: `id`, `clock_id`, `entrant_id`, `knocked_out_by: string | null`, `busted_at`, `created_at`.

**Verify on dev** (each in a transaction that's rolled back, as in phase 1):
- As the dev admin, on a test clock with three entrants: bust A (place 3, knocked out by B) → A placed, one knockout row. Bust A again → `no_data_found`. Bust C into place 3 → `unique_violation`, and C is still in with no knockout row.
- `undo_clock_bust(A)` → A back in, knockout row gone; again → `no_data_found`.
- A knockout naming a player from another clock → foreign key error. A player knocking themselves out → check error.
- Deleting A while A has a knockout → foreign key error. Deleting the clock removes entrants and knockouts.
- As anon: `select` works; calling either function → permission denied. As a non-admin user → RLS refuses the writes.
- `get_advisors` (security) on dev shows nothing new for `_clock_knockouts`.

**Commit:** `feat: record knockouts when a clock player busts` (the migration file and the type)

### Task 2: Player names, order and sign-up rules (pure)

**Files:**
- Create: `features/clock/lib/players.ts`, `features/clock/lib/players.test.ts`

**Contract:**
- `type MemberName = Pick<Member, "id" | "first_name" | "last_name">`.
- `entrantNames(entrants, members: MemberName[]): Map<string, string>`: entrant id → display name, using decision 4. A member missing from `members` shows as "Member".
- `type PlayerRow = { entrant: ClockEntrant; name: string; isGuest: boolean; knockouts: number }`.
- `listPlayers(entrants, knockouts, names): { left: PlayerRow[]; out: PlayerRow[] }`: players still in by name; players out by finishing place, best first (2nd, 3rd, …, 9th). `knockouts` counts rows where the player is `knocked_out_by`.
- `cleanGuestName(name): string | null` (trimmed; null when blank), `GUEST_NAME_MAX_LENGTH = 40`.
- `planAddEntrants(clock, entrants, memberIds, guestNames): Result<{ member_id, guest_name }[], AddRefusal>` with refusals `finished`, `after_first_bust`, `nothing_to_add`, `already_playing` (a member already in this clock), `bad_guest_name` (blank or too long), `duplicate_guest` (same name twice, ignoring case, among guests already in or being added).
- `canRemoveEntrant(entrant, knockouts): boolean`: never busted and in no knockout row.

**Test scenarios:**
- "Alex Smith" and "Sam Jones" → "Alex S.", "Sam J.". "Alex Smith" and "Alex Stone" share "Alex S.", so both show full names. Guest "Uncle Rob" → "Uncle Rob".
- `listPlayers` with three in and two out → in by name; out as 4th then 5th; knockout counts right.
- `planAddEntrants`: finished clock → `finished`; after one bust → `after_first_bust`; a member already in → `already_playing`; guest "  " → `bad_guest_name`; 41 characters → `bad_guest_name`; "rob" when "Rob" is in → `duplicate_guest`; two members and a guest in setup → three rows.
- `canRemoveEntrant`: fresh player → true; busted → false; knocked someone out → false.

**Commit:** `feat: name, order and sign up clock players`

### Task 3: Money and players for the display (pure)

**Files:**
- Modify: `features/clock/lib/display.ts`, `features/clock/lib/display.test.ts`

**Contract:** `describeField(clock, entrants): FieldView`:
- `playersLeft`, `entrantCount`
- `pool` (`computePool`), `poolText` (`formatDollars`)
- `avgStackText`: `computeChips` total ÷ players left, `formatChips`, rounded to a whole chip; null with nobody left or no entrants
- `payouts: { place: number; label: string; amountText: string }[]`, from `computePayouts(pool, clock.payout_pcts, entrantCount)`: "1st $217.80"
- Empty field (no entrants) → zero players, `$0` pool, no payouts and null avg stack; the display then hides the panel.

**Test scenarios:** 11 players, no rebuys, 4 paid → pool $440, payouts 217.80 / 118.80 / 59.40 / 44 (the design's example); with rebuys to $600 → 297 / 162 / 81 / 60; 3 players and 4 paid → 3 places; avg stack for 10 players with 2 rebuys and 6 left → 40,000; no entrants → empty.

**Commit:** `feat: describe the field and payouts for the display`

### Task 4: Entrant and knockout data

**Files:**
- Create: `features/clock/data/entrants.ts`
- Modify (if useful): `features/clock/data/clocks.ts`

**Contract** (`{ data, error }` style):
- `getEntrants(db, clockId)`, `getKnockouts(db, clockId)`: all rows for the clock.
- `getMemberNames(db)`: visible members' id, first and last name, by first name. Also members who are already entrants but no longer visible: fetch by id so their names still show.
- Small merge helpers for Realtime, tested in `data/entrants.test.ts`: `upsertRow(rows, row)` (replace by id or add) and `removeRow(rows, id)`.

**Commit:** `feat: read clock players and knockouts`

### Task 5: Player actions

**Files:**
- Create: `features/clock/actions/entrants.ts`
- Create: `features/clock/lib/player-messages.ts` (refusal → message, tested)

Each action: admin check → read the clock, entrants and knockouts (and the database time where a time is saved) → plan with the pure rule → write → return `{ success, message, entrants?, knockouts? }` so the screen updates before the Realtime events. Errors are logged and returned as a message, as in `actions/clocks.ts`.

- `addEntrantsAction(clockId, memberIds, guestNames)`: `planAddEntrants` → one insert. A unique violation (member added on another screen) → the "changed on another screen" message.
- `removeEntrantAction(entrantId)`: `canRemoveEntrant` → delete. A foreign key error → "This player can't be removed now."
- `bustEntrantAction(entrantId, knockedOutBy: string | null)`: `planBust` with the database time; `knockedOutBy` must be another player still in → `bust_clock_entrant`. `unique_violation` / `no_data_found` → the "changed on another screen" message.
- `undoBustAction(entrantId)`: `planUndoBust` → `undo_clock_bust`.
- `rebuyEntrantAction(entrantId)`: `planRebuy` → update `rebuys` (and clear the bust for a re-entry) where `rebuys` still equals the value read; no row back → the "changed on another screen" message.
- `updatePayoutsAction(clockId, placesPaid, payoutPcts)`: refused once finished; the same payout checks as templates (`validateSettings` fields `places_paid` and `payout_pcts`) → update the two columns.

**Message tests:** each refusal from `planBust`, `planUndoBust`, `planRebuy` and `planAddEntrants` maps to a plain sentence ("Only the most recent bust can be undone.", "Everyone left is in the money: no more rebuys.", "Players can't be added after the first bust.", …).

**Verify on dev:** each action against a test clock; refusals return their messages and change nothing.

**Commit:** `feat: add, bust, undo and rebuy clock players`

### Task 6: `useEntrants` hook

**Files:**
- Create: `features/clock/hooks/use-entrants.ts`
- Modify: `features/clock/hooks/use-clock.ts` only to share the subscribe/visible helpers if that's clean (extract them into `hooks/realtime.ts` rather than copying)

**Contract:** `useEntrants(clockId, initial: { entrants; knockouts }): { entrants; knockouts; applyResult(result) }`

- One channel with two `postgres_changes` listeners: `_clock_entrants` and `_clock_knockouts`, `filter: clock_id=eq.<id>`, all events.
- Realtime doesn't filter deletes, so a delete is applied only when its old row's `clock_id` matches (both tables have `replica identity full`).
- Refetch both lists on every (re)subscribe and when the tab becomes visible.
- `applyResult` applies the rows an action returned.

**Commit:** `feat: keep clock players live with Realtime`

### Task 7: Players on the control screen

**Files:**
- Modify: `app/admin/clock/[id]/page.tsx` (load entrants, knockouts and member names with the clock)
- Create in `features/clock/components/players/`: `players-card.tsx`, `player-row.tsx`, `add-players-sheet.tsx`, `bust-dialog.tsx`
- Modify: `features/clock/components/control/clock-controls.tsx` (render the players card under the clock card)

**Players card:**
- Header: "Players 8 / 10" and an **Add** button (disabled after the first bust, finished, with the reason in its title and a short note).
- **In:** a row per player: name (Guest tag), rebuy count ("2 rebuys"), knockout count (a small KO badge), and buttons **Rebuy** and **Bust** (round, labelled for screen readers). A remove button (trash) shows only where `canRemoveEntrant`.
- **Out:** in finishing order: place ("4th"), name, "KO by Alex S." when recorded. The most recent bust has **Undo** and **Rebuy** (re-entry).
- Empty state: "No players yet. Add the people playing."

**Add players sheet:** a searchable checklist of members (already playing: checked and disabled), and a guest name field with **Add guest** that builds a list of guest chips (removable). **Add N players** saves all at once.

**Bust dialog:** "Bust Alex S.? They finish 7th." with a **Knocked out by** select (players still in other than them, plus "Not recorded", the default) and **Bust**.

Each press follows phase 4's pattern: `useTransition`, apply the returned rows, toast the message on failure. No optimistic planning here: a bust waits for the save (it's not timing-sensitive, and the place must be right).

**Commit:** `feat: manage clock players from the control screen`

### Task 8: Edit payouts on the control screen

**Files:**
- Create: `features/clock/components/control/payouts-sheet.tsx`
- Modify: `clock-controls.tsx` (an **Edit payouts** button in the card header or under the players card)

The sheet reuses `PayoutFields` (places paid fills in a suggested split) and shows the live payouts for the current field (`describeField`) as you type. **Save** calls `updatePayoutsAction`; the clock row comes back over Realtime and the display updates.

**Commit:** `feat: edit a clock's payouts while it runs`

### Task 9: Players and money on the display

**Files:**
- Modify: `app/clock/[id]/page.tsx` (load entrants, knockouts and member names with the public client)
- Create: `features/clock/components/display/field-panel.tsx`
- Modify: `clock-display.tsx` (layout with the panel), and the control screen's compact face if a small summary fits ("8 left · Avg 25,000 · Pool $440")

**Panel:** Players left "8 / 10" with the names of those still in (wrapping; a count only when they don't fit), Avg stack, Pool, and the payouts list ("1st $217.80"…). Hidden with no entrants. Landscape: a column beside the clock; portrait: under it. The countdown keeps its size priority; check 1080p, a laptop and a phone in both orientations with 10 and with 20 players.

**Commit:** `feat: show players left, average stack and payouts on the display`

### Task 10: Click-through on dev

Run `npm run dev`; control in one browser, display signed out in another (confirm the browser with the user first).

- Add 6 members and 2 guests; a duplicate guest name and a member twice are refused. Remove a guest. The display shows 7 players, pool and payouts.
- Start; bust two players (one with "Knocked out by", one without) → places 7th and 6th; the display updates within about a second; KO count shows.
- Add is now disabled with its note.
- Undo the 6th → back in; undo on the 7th is refused (not the most recent) and has no button anyway.
- Rebuy a player in; rebuy the most recent bust (re-entry); a third rebuy past max is refused. Pool and avg stack follow.
- Bust down to 4 left (4 paid) → rebuy refused: in the money.
- Edit payouts to 3 paid → display payouts change.
- Two admin tabs: bust in one, then bust a different player in the other without refreshing → places stay consecutive or the second is refused with the message.
- Refresh the display mid-game; DevTools offline then online → players catch up.
- Delete the test clock afterwards (entrants and knockouts go with it).

Fix anything found (with a test where the bug is in `lib/`); commit each fix separately.

### Task 11: Docs

- Design doc: phase 5 done; the `_clock_knockouts` table and its two functions in the data model; adding players only until the first bust; removal rules; names; payouts editable on the control screen.
- This plan: mark tasks done and note any changes.

**Commit:** `docs: record clock phase 5 decisions`

---

## Refinement pass

### Task R1: Lint and format
**Skill:** lint-and-format. Prettier and `npm run lint -- --fix` on the changed files; `npx tsc --noEmit` (ignoring `.next/`); `npm test`.
Commit: `style: lint and format clock phase 5`

### Task R2: Reduce complexity
**Skill:** reduce-complexity. Watch `players-card.tsx`, `add-players-sheet.tsx`, `actions/entrants.ts` and `use-entrants.ts`.
Commit: `refactor: reduce complexity in the clock players`

### Task R3: Improve readability
**Skill:** improve-readability.
Commit: `refactor: clarify the clock players`

### Task R4: Make it DRY
**Skill:** make-it-dry. Look at the action boilerplate (admin check, load, error mapping) across `actions/clocks.ts` and `actions/entrants.ts`, and the Realtime helpers across the two hooks.
Commit: `refactor: share <what> between <where>`

### Task R5: Standards alignment
**Skill:** standards-alignment. Explicit return types on exports, labels on icon-only buttons, no stray `console.log`.
Commit: `refactor: align clock phase 5 with standards`

Skip any refinement task that finds nothing; no empty commits.
