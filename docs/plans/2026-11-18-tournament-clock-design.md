# Tournament Clock — Design

- **Date:** 2026-11-18
- **Branch:** `feat/tournament-shot-clock`
- **Status:** Approved. Phases 1–8 are built on dev. Still to do: phase 4's on-device check, and the prod rollout of every clock migration (phase 4's Task 10, now including phase 5's knockouts). Plans: `docs/plans/2026-11-19-tournament-clock-phase-4-clock-core.md`, `...-phase-5-entrants.md`, `docs/plans/2026-11-20-tournament-clock-phase-6-tv-mode-sounds.md`, `docs/plans/2026-11-20-tournament-clock-phase-7-finish-flow.md`, `docs/plans/2026-11-20-tournament-clock-phase-8-nav.md`.

## Goal

A live blinds/level clock for NLPT tournaments. An admin runs it from their phone; a TV and any player's phone show the same clock in real time. The clock tracks which members (and guests) are in, rebuys, and bust-out order, and when the tournament ends it hands off a prefilled tournament record + sessions for review, replacing manual entry.

## Decisions

| Topic | Decision |
|---|---|
| Clock type | Blinds/level clock (not a per-action shot clock) |
| Sync | Supabase row holds timestamps; clients compute time locally; Realtime pushes changes |
| Blind structures | Saved, editable templates in Supabase |
| Tournament link | Optional `tournament_id`; finish flow creates/updates the tournament |
| Extras (v1) | Players left (named), avg stack, sounds, prize pool & payouts, full-screen TV mode |
| Entrants | Members + guests |
| Money/chips | Set per clock, defaulted from the template |
| Payouts | The last paid place gets 1 ÷ players of the pool, rounded up to a whole percent (at least the buy-in back; more after rebuys); the places above split the rest by %; no rounding of amounts |
| Places paid | Default on the template, editable per clock; **minimum 3** |
| Starter default | "NLPT Standard": $40 buy-in and rebuy, 20,000 chips each, 4 paid: 1st–3rd split 55/30/15, 4th gets the last-place share. 16 levels of 20 min on the round big blind ladder (100/200 … 7,500/15,000), 10-min breaks after levels 4, 8 and 12; 5h 50m |
| Rebuys | At most `max_rebuys` per player (default 2), and none once players left ≤ places paid |
| Finding the clock | A "Tournament live" banner on the league pages while a clock is running or paused, linking to its display (phase 8) |
| Results | The finish step writes `_tournaments` / `_tournament_sessions` |
| Player phone view | None in v1; the shared display is enough |
| Tests | Vitest for the pure logic (`npm test`) |
| Guests in results | Counted in the pool and live placing; excluded from saved sessions; members re-ranked |
| Knockouts | Each bust can record who knocked the player out (optional); kept in `_clock_knockouts` for later use (results, trinkets) |
| Adding players | Any time before the clock finishes, except while anyone is out |

### Sync approach (chosen: A)

- **A. DB row + Realtime (chosen):** clock state is timestamps, so it survives refreshes, sleeping phones, and late joiners; RLS gates writes to admins.
- B. Admin device broadcasts ticks: rejected — clock dies if the admin's phone sleeps; no persistence.
- C. DB row + polling: rejected — multi-second lag on pause/skip is visible on a TV.

## Data model

Tables use the v2 `_` prefix. Migrations: `supabase/migrations/20261119163253_tournament_clock_schema.sql` and the three after it.

### `_blind_structures` (templates)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `name` | text, unique | e.g. "NLPT Standard" |
| `default_buy_in` | numeric | default 40; copied to the clock, where it can be changed |
| `default_rebuy` | numeric | default 40 |
| `default_starting_chips` | int | |
| `default_rebuy_chips` | int | |
| `default_places_paid` | int | `>= 3`; default 4 |
| `default_payout_pcts` | numeric[] | one % per place **above** the last paid place (places_paid − 1 values), each > 0, summing to 100; default `{55,30,15}` |
| `default_max_rebuys` | int | per player; default 2 |
| `created_at` | timestamptz | |

The payout check is `private.payout_pcts_valid(pcts, places_paid)`, shared by templates and clocks. It lives in the `private` schema so it isn't exposed through the API.

### `_blind_levels` (template levels)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `structure_id` | uuid fk → `_blind_structures` | cascade delete |
| `position` | int | order within structure; unique per structure, deferred so a reorder can swap positions in one transaction |
| `kind` | text | `level` \| `break` |
| `small_blind`, `big_blind` | int | null for breaks; for levels `small_blind > 0` and `big_blind >= small_blind` |
| `ante` | int | default 0 |
| `duration_seconds` | int | |
| `note` | text, nullable | breaks only, 1–100 characters (e.g. "Color up the 25s"); copied into a clock's `levels` snapshot and shown on the display during the break |

### `_tournament_clocks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `name` | text | |
| `structure_id` | uuid fk, nullable | template it was created from (informational) |
| `tournament_id` | uuid fk → `_tournaments`, nullable | set at creation or by the finish flow (v2 table; see Phase 0) |
| `levels` | jsonb | **snapshot** of the template's levels; editing a template never changes a running clock |
| `status` | text | `setup` \| `running` \| `paused` \| `finished` |
| `level_index` | int | last persisted level |
| `level_started_at` | timestamptz | server time the current level (effectively) started |
| `paused_remaining_ms` | int, nullable | set while paused |
| `buy_in`, `rebuy` | numeric | copied from template defaults |
| `starting_chips`, `rebuy_chips` | int | copied from template defaults |
| `places_paid` | int | copied, editable until finish; `check (places_paid >= 3)` |
| `payout_pcts` | numeric[] | copied, editable until finish; same check as the template |
| `max_rebuys` | int | copied from the template |
| `created_at` | timestamptz | |

A check keeps status and timestamps consistent: `setup` has neither `level_started_at` nor `paused_remaining_ms`; `running` has `level_started_at` and no `paused_remaining_ms`; `paused` has `paused_remaining_ms`.

### `_clock_entrants`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `clock_id` | uuid fk → `_tournament_clocks` | cascade delete |
| `member_id` | uuid fk → `members`, nullable | null = guest |
| `guest_name` | text, nullable | required when `member_id` is null |
| `rebuys` | int | default 0 |
| `busted_at` | timestamptz, nullable | null = still in |
| `finish_place` | int, nullable | assigned at bust (players remaining at time of bust) |

Constraints: exactly one of `member_id` / `guest_name` is set (a guest name can't be blank, and is at most 40 characters); a member appears at most once per clock; `busted_at` and `finish_place` are set together; no two entrants in a clock share a `finish_place`; `(clock_id, id)` is unique so knockouts can point at a player in the same clock.

### `_clock_knockouts`

Migration: `supabase/migrations/20261120043702_tournament_clock_knockouts.sql` (phase 5).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `clock_id` | uuid fk → `_tournament_clocks` | cascade delete |
| `entrant_id` | uuid | the player who went out; fk `(clock_id, entrant_id)` → `_clock_entrants` |
| `knocked_out_by` | uuid, nullable | who knocked them out; null = not recorded; same-clock fk; never the player themselves |
| `busted_at` | timestamptz | the bust's time |
| `created_at` | timestamptz | |

One row per bust. It stays when the player rebuys back in (the knockout still happened); undoing the bust deletes it. A player in any knockout can't be deleted (no cascade from players); deleting the clock removes both.

Two `security invoker` functions keep a player's place and their knockout row together:

- `bust_clock_entrant(p_entrant_id, p_finish_place, p_busted_at, p_knocked_out_by)`: sets the place and adds the knockout row. A player already out raises `no_data_found`; another screen's bust into the same place raises `unique_violation`.
- `undo_clock_bust(p_entrant_id)`: clears the place and deletes the player's newest knockout row; `no_data_found` when they aren't out.

Both are executable by `authenticated` only; RLS decides who can write (a non-admin's bust finds no row it may update, so it also reports `no_data_found`).

### Derived values (computed, not stored)

- **Players left** = entrants with `busted_at` null (shown by name).
- **Prize pool** = `entrants × buy_in + Σ rebuys × rebuy`.
- **Total chips** = `entrants × starting_chips + Σ rebuys × rebuy_chips`; **avg stack** = total chips ÷ players left.

### Payout rule

Given pool `P` (buy-ins plus rebuys), `E` players (entrants, not counting rebuys), places paid `N` (≥ 3), and `payout_pcts` (one per place above the last, each > 0, summing to 100):

1. **Last paid place** gets `ceil(100 ÷ E)` percent of `P`. Before rebuys, `P = E × buy-in`, so `100 ÷ E` percent is exactly the buy-in back; rounding up to a whole percent means it's at least the buy-in. The percentage is fixed by the player count, so rebuys raise the last place's payout too.
2. **Places 1..N−1** split what's left, `P − last place`, by `payout_pcts`.
3. No rounding of amounts (round where shown or saved).
4. If entrants < N, only places 1..entrants are paid: the last of them gets the last-place share and the shares above are scaled to sum to 100. A lone player gets the whole pool.
5. With very few players the last place can out-earn the place above it (5 players, 4 paid: 4th 20%, 3rd 12%). Decided: pay by the rule, no warning.

Example: 11 players at $40. Last place: 100 ÷ 11 = 9.09% → **10%**.
- No rebuys, pool $440 → 4th $44; 1st–3rd split $396 as 55/30/15 → $217.80, $118.80, $59.40.
- With rebuys, pool $600 → 4th $60; 1st–3rd split $540 → $297, $162, $81.

Suggested splits for the places above the last (the editor fills these in):

| Places paid | Split above the last place |
|---|---|
| 3 | 65/35 |
| 4 | 55/30/15 (default) |
| 5 | 45/28/17/10 |

### Rebuy rules

- At most `max_rebuys` per player (default 2).
- No rebuys once players left ≤ places paid (everyone left is in the money). The bubble player can't rebuy back in once the money is reached.
- Only while the clock is running or paused.
- A busted player can rebuy (re-enter) only as the **most recent bust**, the same rule as undo. Otherwise the next bust would get a place someone already has.

`planRebuy` in `features/clock/lib/entrants.ts` applies all four, on the control screen (which buttons show) and in `rebuyEntrantAction`. The in-the-money cutoff changes as players bust, so it can't be a table check.

### Permissions (RLS)

- `select` open to `anon` and `authenticated` on all five tables (TV and player phones need no login).
- `insert`/`update`/`delete` only when `is_league_admin()` (checks `profiles.role`), the same five policies as `_tournaments`. Server actions also check the app's admin gate.
- Realtime publication enabled for `_tournament_clocks`, `_clock_entrants` and `_clock_knockouts`. The last two have `replica identity full`, so a delete event carries the old row's `clock_id`; the client checks `clock_id` on deletes itself (`applyRowChange`).

## Clock timing

All state transitions are writes of timestamps; nothing ticks in the database.

The calculations are in `features/clock/lib/timing.ts`. Each control returns the columns to save (or refuses with a reason), and every result satisfies the database's status rule.

- **Remaining in current level** = `levels[level_index].duration_ms − (serverNow − level_started_at)`, never below 0 (`getClockPosition`).
- **Start:** `status=running` at the saved level (0 for a new clock), `level_started_at=now`.
- **Pause:** `status=paused`, saving the caught-up `level_index` and its `paused_remaining_ms`; `level_started_at=null`.
- **Resume:** `status=running`, `level_started_at = now − (duration − paused_remaining_ms)`, `paused_remaining_ms=null`.
- **Next/prev level:** the chosen level starts with its full time: `level_started_at=now` while running, `paused_remaining_ms=<full duration>` while paused.
- **Adjust time (+/− 1 min):** sets the time left to `max(0, left + change)`. Removing more than is left ends the level now; adding to a last level that has run out gives exactly the added time.
- **Finish:** `status=finished`, saving the caught-up level and the time left.
- **Auto-advance:** every client walks forward through `levels` from `level_started_at` to find the effective level, so displays are correct even if nobody writes. The admin control screen, when open, persists the advance with a conditional update (`where level_index = <old>`), so duplicate writes from multiple admin tabs are no-ops (`catchUpUpdate`).
- **Clock skew:** on load (and on Realtime reconnect) the client fetches server time via the `server_now()` RPC (`clock_timestamp()`, not `now()`, which is the transaction start; callable by anon), measures round trip, and stores `offset = serverTime + rtt/2 − Date.now()` (`serverOffsetMs`). All countdowns use `Date.now() + offset`.
- Every timestamp written uses server time (the server action's clock or `server_now()`), never the admin device's clock. The lib functions take the time as `nowMs`, so they never read a clock themselves.

## Screens & routes

| Route | Who | Purpose |
|---|---|---|
| `/clock/[id]` | Public | Display: level, countdown, current/next blinds & ante, next break, players left (names), avg stack, prize pool & payouts. "TV mode" toggle → fullscreen + Wake Lock. Outside the `(home)` route group, so no header or tab bar. |
| `/admin/clock` | Admin | List clocks: name, status, created date, Control and Display links, delete. |
| `/admin/clock/new` | Admin | Create a clock from a template: pick the template, adjust money/chips/payouts. No tournament link here; the finish flow picks or creates the tournament. |
| `/admin/clock/[id]` | Admin | Control: start/pause/resume, prev/next level, ±1 min; a Players card (add members and guests, bust with an optional knockout, undo, rebuy, remove); a Payouts card (what each place pays now, edit places paid and the split). |
| `/admin/clock/[id]/finish` | Admin | Review & save results (see Finish flow). |
| `/admin/clock/structures` | Admin | CRUD templates and their levels (add/remove/reorder levels and breaks). |

Code layout follows the repo's convention: `features/clock/{components,hooks,lib,actions}` with thin route files under `app/`.

- `features/clock/lib/` — pure functions, no React/Supabase imports, so they're easy to test:
  - `levels.ts`: `parseLevels` (checks a clock's `levels` with the `_blind_levels` rules), level lengths, `levelNumber`.
  - `timing.ts`: `getClockPosition`, the clock controls, `catchUpUpdate`, `nextPlayingLevel`, `timeToNextBreakMs`, `serverOffsetMs`.
  - `format.ts`: `formatClockTime` (`15:00`, `1:01:01`; rounds up to the second), `formatBlinds` (`1,000 / 2,000 (ante 200)`), `formatBlindPair` (without the ante), `formatClockDate` (`Nov 27, 2026` in the league's time zone, `America/Chicago`).
  - `clocks.ts`: `clockSettingsFromStructure`, `validateClockSettings`, `buildClockInsert` (a new clock's row, with a snapshot of the template's levels), `clockStatusLabel`.
  - `display.ts`: `describeClock`, everything a screen shows at one moment (`ClockView`); `describeField`, the players and money (`FieldView`).
  - `controls.ts`: `planControl` (each control button → the columns to save, moving levels from where the clock has got to), `controlRefusalMessage`.
  - `money.ts`: `computePool`, `lastPlacePct`, `computePayouts`, `computeChips`.
  - `entrants.ts`: `planBust`, `planUndoBust`, `planRebuy`, `planFinish`.
  - `players.ts`: `entrantNames` (on-screen names), `listPlayers` (in by name, out by place, knockout counts), `planAddEntrants`, `addPlayersBlocked`, `canRemoveEntrant`, `planBustPlayer`, `planUndoPlayer` (the phase 2 rules plus clock status and the knockout check).
  - `player-messages.ts`: a sentence for every player refusal.
  - `results.ts`: `buildFinishResults`.
  - `result.ts`: the `{ ok, value } | { ok, reason }` type the rules return when they can refuse.
- `features/clock/data/` — Supabase reads: `clocks.ts` (`getClocks`, `getClock`, `getServerNowMs`, `toClock`, `mergeClockRow`), `entrants.ts` (`getEntrants`, `getKnockouts`, `getMemberNames`, `applyRowChange`) and `structures.ts`.
- `features/clock/hooks/` — `useClock(initialClock, initialNowMs)`: Realtime subscription, server-time offset (`useServerOffset`), and a `describeClock` view redrawn every 250 ms. `useEntrants(clockId, initial)`: a clock's players and knockouts kept live. `useOnVisible`: shared by both.
- `features/clock/actions/` — server actions for every admin mutation; each re-checks admin via `getCurrentUser()` in addition to RLS.

### Template editor (phase 3)

`/admin/clock/structures` lists templates (levels, breaks, length, money, payouts) with edit, duplicate ("Copy of …") and delete. `/new` and `/[id]` share one editor; the whole template saves at once through `save_blind_structure(p_id, p_structure, p_levels)`, which writes the template and replaces its levels in one transaction (`security invoker`, so RLS still decides who can write).

- **Settings:** name, buy-in, rebuy, starting/rebuy chips, max rebuys, and two editor-only lengths (**New level length**, **New break length**) that start at the template's most common lengths and aren't saved.
- **Payouts:** places paid fills in a suggested split (65/35, 55/30/15, 45/28/17/10); one box per place above the last; a running total.
- **Levels as a timeline:** each stop shows its start time, blinds (and ante) or the break's note, and length; tap a stop to edit it (one open at a time). Breaks are highlighted. Reorder by dragging the handle (dnd-kit: mouse, touch, keyboard).
- **Add level** suggests the next round big blind (1, 1.5, 2, 3, 4, 5, 6, 8 × each power of ten; never doubles), small blind half of it, ante from the level above, the new level length.
- **Break notes:** optional, breaks only, up to 100 characters.
- **Saving:** validation matches the database checks and blocks Save with messages by the field or row; "No Changes" compares what would be saved, so undone edits don't count; leaving with unsaved changes asks first.

### Clock core (phase 4)

- **Creating:** `/admin/clock/new` picks a template (NLPT Standard first), fills in its money, chips, payouts and max rebuys, and names the clock after the template (no date: the clock list shows when each was created, and names needn't be unique). The settings and payout fields are the template editor's, shared through `settingsReducer`. Levels can't be changed per clock. A clock starts in setup with no tournament link; until the finish flow (phase 7) it can only be deleted.
- **Database time:** each control action reads the clock and `server_now()` together and passes that time to the timing rules, so saved times and every screen's countdown use one clock.
- **Conditional writes:** a control saves only `where status = <old> and level_index = <old>`. If another screen got there first it saves nothing and says "The clock changed on another screen. Try again." Next.js runs one browser's actions one after another, so a double press on one screen is refused by the timing rules instead ("The clock isn't in a state for that."). Two +1 minute presses on the same level from two screens can both apply.
- **Catch-up:** while the control screen is open, it saves a level that ran out (`catchUpClockAction`), once per saved level, with the same conditional write.
- **Live screens:** the page renders with the database time, and the client starts from it, so the first paint matches the server's HTML. Realtime updates are merged into the clock (`mergeClockRow`), since Postgres can leave unchanged large values such as `levels` out of an update. Every (re)subscribe and every wake (`visibilitychange`) refetches the row and re-measures the offset.
- **Display:** sized with `min(vw, dvh)` so it fits a 1080p TV and a phone in either orientation. Shows the clock's name, Level N or Break (with the note), the countdown (dimmed when stopped), a progress bar, blinds and ante, and the next blinds and time to the next break, or "Final level". The top-left corner shows the status while the clock isn't running (Paused in red; Not started and Finished in grey) and Reconnecting… while Realtime is down, in the display's top-left corner and the control card's header. A missing clock or an id that isn't a uuid is not found.
- **Control screen:** everything is in the clock's card. Its header (aligned to the top) has the status tag on the left, the clock's name in the middle (centred, up to two lines), and round icon buttons on the right that open the display or copy its address. Below it: round − and + buttons either side of the countdown, and under the details a big round play/pause button (solid Tabler player icons; Start asks first) between round previous/next level arrows. Each is enabled only when it applies. Presses are optimistic: the screen applies the planned columns at once (`planControl` with the screen's server-corrected time, layered with React's `useOptimistic` over Realtime updates) and the buttons never wait, so presses can follow each other; the saved row replaces the plan when the action returns (usually the same second), and a refusal reverts it. Other screens follow when the save lands. Copying the display link shows it in a toast where the clipboard isn't available, such as a LAN address.

### Entrants (phase 5)

- **Names:** members show as first name and last initial ("Alex S."), or their full name when that would match another player (members or guests, ignoring case). Guests show their name as typed (up to 40 characters) and get a "Guest" tag on the control screen.
- **Adding players:** a drawer with a searchable member checklist (anyone playing is ticked and disabled) and a guest name field that lists guests as removable chips; one save adds them all. Allowed in any status but finished, **while nobody is out**: a bust's place is the number of players left, so a player added while someone is out would give the next bust a taken place. A re-entry that brings everyone back in allows adding again.
- **Removing** (a sign-up mistake): only a player who has never busted and isn't in any knockout.
- **Players card:** players still in by name, with rebuys, a KO count, and Rebuy / Bust (and remove); players out by place with "KO by …", the most recent bust with Undo and Rebuy. A button shows only when its action is allowed; one note covers the common reasons (clock not started; everyone left in the money; adding while someone is out).
- **Bust dialog:** "Bust Alex S.? They finish 7th." with **Knocked out by** (the other players still in, or Not recorded, the default).
- **Payouts card:** the pool and what each place pays now; **Edit** opens the payout fields with a live preview for the current field. Editable until the clock finishes.
- **Display:** once there are players, a panel beside the clock (landscape) or under it (portrait): Players left/entrants, Avg stack, Pool, the names still in (breaking only between names; three lines at most in portrait), and the payouts. The countdown uses a smaller width-based size beside the panel so it fits.
- **Actions** (`features/clock/actions/entrants.ts`): each checks for an admin, reads the clock, players and knockouts, applies the pure rule, writes, and returns the saved lists so the pressing screen updates before Realtime. Busts use the database time.
- **Live players:** `useEntrants` applies each Realtime change and refetches both lists on every (re)subscribe, on wake, and a second after changes stop arriving. On dev, one knockout insert was dropped just after subscribing; the delayed refetch heals a missed event within a moment.

### Entrant actions

- **Bust:** sets `busted_at=now` and `finish_place = players left before the bust`, and adds a knockout row (`bust_clock_entrant`). Only while the clock is running or paused; refused for the last player left; "knocked out by" must be another player still in.
- **Undo bust:** clears both and deletes the knockout row (`undo_clock_bust`); only for the most recent bust, to keep places consistent, and only while running or paused.
- **Rebuy:** increments `rebuys`; if the player is busted, also clears `busted_at`/`finish_place` (re-entry, most recent bust only). See Rebuy rules.
- The last remaining player gets `finish_place=1` when the admin finishes the clock; refused while more than one player is left.

### Sounds & TV mode (phase 6)

- **Chimes,** on the display only (`/clock/[id]`), synthesized with the Web Audio API from note lists (`features/clock/sounds/chimes.ts`; no audio files): **warning**, two high pips when the time left crosses one minute (levels and breaks); **level**, a rising C–E–G when a new playing level starts; **break**, two soft falling notes when a break starts. Nothing plays when the last level runs out.
- **When they play** (`planSoundCue` in `lib/sounds.ts`): each display tick (4 a second, and every Realtime update) is compared with the one before. A chime plays only if both ticks are running and less than 2 seconds apart, so starting, pausing, resuming, level changes made while paused, the first tick after loading, and a tab catching up after sleeping or reconnecting are all silent. Next/Previous while running chime like a level change; a minute added or removed that crosses the one-minute mark warns.
- **Sound control:** a speaker button in the display's top-right corner, off by default, remembered per browser (localStorage, read with `useSyncExternalStore` so the server HTML has it off; kept in memory where storage is blocked). Browsers only start audio from a tap, so with sound on, a fresh page load shows "Tap to enable sound" until any tap on the page.
- **TV mode:** a button next to the speaker: fullscreen (Fullscreen API) plus a screen wake lock (taken again when the tab becomes visible; a lock that arrives after leaving TV mode is released), and it turns sound on in the same tap. Esc or the button leaves it. In TV mode the corner buttons fade and the cursor hides after 3 seconds without mouse, touch or keys; the status badges stay. Fullscreen or the wake lock is skipped quietly where the browser lacks it (an iPhone can't make a page fullscreen).
- **Development:** each chime logs `[clock-sound] <cue>` with `console.debug` in development, so it can be checked without hearing it.

## Finish flow

Built in phase 7. Migration: `supabase/migrations/20261120162924_tournament_clock_finish.sql`.

1. **End tournament** is a button on the control screen, never automatic. It's shown while the clock is running or paused, enabled once one player is left (otherwise it says to bust players down to one), and asks first: "End the tournament? Alex S. wins." `finish_tournament_clock` then sets the clock `finished` with the level and time left it had got to, and places the last player 1st (`busted_at` = the finish time), in one transaction; another screen finishing first, or the players changing, is refused.
2. **Reopen** (`reopen_tournament_clock`) undoes a finish pressed by mistake: the clock goes back to paused with the same time left and the winner back in. Only until results are saved.
3. **Review** at `/admin/clock/[id]/finish` (a clock that isn't finished goes back to its control screen). The form is prefilled by `finishFormDefaults` (`lib/finish-form.ts`) and everything is editable:
   - **Name:** the clock's name. **Date:** the day the clock was created, in `America/Chicago` (a late game saved the next morning keeps its date). **Season:** the newest. **Week:** left empty and required (seasons are created with all their weeks and weeks have no dates, so there's no safe default; decided 2026-11-20).
   - **Tournament numbers** from `buildFinishResults`: places actually paid, buy-in, rebuy, player count and total rebuys (guests included).
   - **Members**, re-ranked 1, 2, 3… among themselves, each with the payout of their **true** place (to the cent): if a guest wins, the member who came 2nd is saved 1st with the 2nd-place payout. Rebuys and cash-out are editable. **Guests** are listed underneath for reference and not saved.
   - `validateFinishForm` matches the tables' checks, with messages by the field or row.
4. **Save** (`saveClockResultsAction` → `save_clock_results`) inserts `_tournaments` and the members' `_tournament_sessions` (no filler rows; buy-in, net profit and points come from `_tournament_session_points`) and links the clock (`tournament_id`), in one transaction. **Saving again** updates that tournament and replaces its sessions, prefilled from what was saved (`finishFormFromSaved`). Afterwards `refreshAfterTournamentSave` (shared with manual entry) recalculates NLPI rankings for the tournament's week (and the week it was in before, if a re-save moved it), clears the league cache and revalidates the league pages.
5. **Status:** the clock list shows "Results saved" (linking to the tournament page) or "Results not saved · Review"; the control screen shows "Finished · <winner> wins" with Review results and Reopen, or Results saved and Edit results.

## Error handling

- **Realtime disconnect:** show a subtle "reconnecting" badge; on reconnect, refetch the clock + entrants and re-sync server time (Realtime doesn't replay missed events).
- **Mutation failure:** server actions return `{ success, message }` like existing actions. The control screen shows each press at once (optimistic), so on a refusal it goes back to the saved clock and shows a toast.
- **Concurrent admins:** clock controls and level advances use conditional updates; a screen that acted on a stale clock is told to try again. Player actions read fresh rows before planning, so a stale screen can't cause a wrong place; a bust into a place another screen just took (the unique place), a bust of a player already out, and a rebuy where `rebuys` changed are refused with "The players changed on another screen. Try again."
- **Template edits mid-tournament:** no effect on running clocks (levels are snapshotted).
- **Clock past final level:** stays on the last level with the countdown at 0:00 (no wrap).
- **Validation:** `payout_pcts` has one value per place above the last paid place, each > 0, summing to 100; guest name required when no member. Both are also database checks.

## Testing

**Vitest** (dev dependency, `vitest.config.mts`) tests the pure functions in `features/clock/lib/`, which carry all the tricky logic. Run `npm test` (or `npm run test:watch`). Tests sit next to the code as `*.test.ts`, with shared builders and the NLPT Standard levels in `test-fixtures.ts`. They cover:

- Effective level / remaining time across pause, resume, adjust, and multi-level catch-up after a sleeping tab; every control's result checked against the database's status rule.
- What the display shows (`describeClock`) in setup, running, paused, on a break and past the last level; each control button's plan (`planControl`); merging Realtime updates and reading numeric columns (`data/clocks.test.ts`).
- Pool, avg stack, and payout rule (last-place share rounded up from 1 ÷ players and kept through rebuys, entrants < places paid, and the whole pool always paid out).
- Bust order, undo, and the rebuy rules (limit, in-the-money cutoff, re-entry).
- Finish results: guest re-ranking, true-position cash-outs, places actually paid.
- Finishing (phase 7): ending (status, players left, the stopping point) and reopening (`lib/finish.test.ts`); the review form's defaults (re-ranking with true-place payouts, the game's date in the league's time zone, guests), checks and save payload, and prefilling from saved results (`lib/finish-form.test.ts`).
- Chimes (phase 6): when the warning, level and break chimes play and every case that stays silent (`lib/sounds.test.ts`); the chime note lists (`sounds/chimes.test.ts`).
- Players (phase 5): names, list order and knockout counts, adding (status, while anyone is out, duplicates, guest name length), removing, bust and undo checks, refusal messages, the display's players and money (`describeField`), and applying Realtime changes (`data/entrants.test.ts`).

Realtime/UI verified manually: two browsers (admin + display), pause/skip/bust propagate within ~1s; refresh mid-level shows correct time; phone sleep/wake resyncs. Phase 5 was clicked through on dev (add, bust with and without a knockout, undo, rebuy limit, re-entry, the in-the-money cutoff, payout edits); offline/online, two admins pressing at once, and phone width weren't checked in the browser.

## Phase 0: Cut tournaments over to the v2 tables

The `league_v2_*` migrations (Aug 2026) created `_tournaments`, `_tournament_sessions`, `_tournament_place_points`, `_scoring_settings`, and the `_tournament_session_points` view, but the app and SQL functions still read the old `tournaments` / `tournament_sessions`, and nothing syncs the two. Phase 0 finishes the tournament half of that cutover so the clock is built on the v2 shape. **Cash stays on v1** for now (`_cash_sessions` is stale since 2026-07-24 and is a separate project).

### Findings (prod `mttdnkrtyknlmbnwdoye`, dev `vykeezhlyltsiuyqkode`; tournament data identical on both)

- 87 of 195 `tournament_sessions` rows (45%) are `place = 0` filler rows for members who didn't play. SQL functions guard inconsistently (`buy_in > 0`, `place > 0`, or not at all).
- `tournament_sessions.buy_in` is total money in (`40 × (1 + rebuys)`); `rebuys` is a count. Exceptions to fix: 2 rows with a buy-in that doesn't match rebuys, 1 row with `net_profit` 143 where `cash_out − buy_in` = 114.
- Tournament rebuy totals disagree with sessions for Luau 2022, Luau 2024, Thanksgiving 2025.
- Guests have played before (Thanksgiving Showdown, Kindred Open, Horace Hoedown have more players than member sessions), so tournament totals cannot be derived from member sessions alone.
- Guest placing is inconsistent historically (Thanksgiving Showdown 2024 skips 4th; others re-ranked). **Decision: leave history as-is.**
- Nothing outside this web app calls the database. `_push_tokens` / `_notifications` (browser notifications) and `trinkets` are out of scope.

### Schema changes

**`_tournaments`**
- Add `buy_in_amount numeric not null default 40`, `rebuy_amount numeric not null default 40`; backfill 40 for existing rows.
- Add `player_count int` and `total_rebuys int` (both include guests), backfilled from old `tournaments`. Prize pool = `player_count × buy_in_amount + total_rebuys × rebuy_amount`.
- Keep `week_id` required; forms and the clock finish flow pick a week. Verify `_weeks` ids line up with the old `week` table before relying on them.

**`_tournament_sessions`**
- Source of truth: `member_id`, `tournament_id`, `rebuys`, `cash_out`, `place`.
- `buy_in` and `net_profit` become derived in the view (`buy_in_amount × (1 + rebuys)`, `cash_out − that`), after fixing the 3 bad rows (before/after shown to the user first).
- Constraints: `place not null check (place >= 1)`, `tournament_id not null`, `unique (tournament_id, member_id)`.

**Points** — use the code's table as the source of truth: extend `_tournament_place_points` to 16 places (15th: 15 POY / 1 NLPI, 16th: 10 POY / 1 NLPI) and change the view's `LEAST(place, 14)` to `LEAST(place, 16)`. Historical places are unchanged, so historical points are unchanged for every existing tournament (none has more than 14 finishers).

### SQL functions

- Repoint the ~20 functions that read `tournament_sessions` / `tournaments` at `_tournament_session_points` / `_tournaments`; drop the filler-row guards.
- Delete stale versions after confirming the app doesn't call them (`get_nlpi_info_new`, `get_nlpi_info_updated`, unused overloads).

### App code

- Admin tournament + session forms, tournament pages, `utils/types.ts` move to the v2 tables.
- Remove `fillInMissingTournamentSessions` and the in-code points maps (points come from the view).

### Rollout

1. Write the migration as SQL files in the repo; apply to **dev** first.
2. Verify: snapshot the output of every tournament-reading function for every season/member on dev **before** the migration, re-run after, and diff. Expected: identical, except the 3 corrected rows.
3. Point a local build at dev and click through stats, tournaments, POY, NLPI, member pages, and admin tournament entry.
4. Apply the same migration to **prod** and re-run the verification.
5. Rename old tables to `legacy_tournaments` / `legacy_tournament_sessions` (read-only); drop after a few weeks.

## Implementation phases

0. **Tournament v2 cutover** (see Phase 0; own PR, dev first). Done (#24).
1. **Schema:** clock tables, RLS, Realtime publication, `server_now()` RPC, types, the NLPT Standard template. Done on dev; goes to prod with phase 4.
2. **Pure logic + tests:** `features/clock/lib` with Vitest. Done; see `docs/plans/2026-11-19-tournament-clock-phase-2-logic.md`.
3. **Templates:** `/admin/clock/structures` CRUD. Done on dev; see `docs/plans/2026-11-19-tournament-clock-phase-3-templates.md`.
4. **Clock core:** create clock, `useClock` hook, public display, admin control (timing only). Built on dev; the on-device check and the prod rollout are still to do (see `docs/plans/2026-11-19-tournament-clock-phase-4-clock-core.md`).
5. **Entrants:** add members/guests, rebuy, bust/undo with knockouts, players left, avg stack, pool & payouts on display. Built on dev; see `docs/plans/2026-11-19-tournament-clock-phase-5-entrants.md`. Its migration goes to prod with phase 4's rollout.
6. **TV mode & sounds.** Built on dev; see `docs/plans/2026-11-20-tournament-clock-phase-6-tv-mode-sounds.md`. No database changes. Fullscreen still needs checking on a real screen (it didn't go fullscreen under browser automation).
7. **Finish flow:** review screen → `_tournaments` + `_tournament_sessions`. Built on dev; see `docs/plans/2026-11-20-tournament-clock-phase-7-finish-flow.md`.
8. **Nav:** admin nav link (done in phases 3–4); "Tournament live" banner while a clock is running or paused (league pages, above the tab bar); link from tournament page when a clock is attached. Built on dev; see `docs/plans/2026-11-20-tournament-clock-phase-8-nav.md`. No database changes.

## Out of scope for v1

- A personal "my status" view on players' phones; everyone uses the shared `/clock/[id]` display.
- Cash-session v2 cutover (`_cash_sessions`, rebuys table) — separate project.
- Browser notifications and trinkets.
