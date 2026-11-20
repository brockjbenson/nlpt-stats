# Tournament Clock Phase 4 (Clock Core) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Status (2026-11-19):** Tasks 1–8 and 11 are done on dev, and the R1–R5 refinement pass follows. Task 9 is partly done (see below). Task 10 (prod rollout) is **still pending** and needs the go-ahead in chat.

**Task 9 so far** (in-app browser, control screen and signed-out display side by side, against dev):
- Create, bad split, template switch (settings refill, break notes copied) and delete.
- Start, pause, resume, next, previous and ±1 minute: both screens and the saved row agree within a second.
- A level that ran out was saved once (`level_index` and its effective start). A double press is refused without applying twice.
- Breaks, refresh mid-level, and fit at 1080p and on a phone in portrait and landscape.

Still to check, on an iPhone: the Reconnecting… badge and catching up after sleep, Safari reading the database's microsecond timestamps, the "changed on another screen" message (needs two devices pressing at once), and the display link's fallback on a LAN address. The test clock "NLPT Standard – Nov 19, 2026" is still on dev for this.

**Changes from this plan:**
- `useClock(initialClock, initialNowMs)`: the page passes the database time it rendered with, so the first client render matches the server's HTML.
- `mergeClockRow` applies Realtime updates onto the clock instead of replacing it, since Postgres can leave out unchanged large values (`levels`). The row "is it newer" check was left out: Realtime brings the latest row a moment later anyway.
- `getClocks` doesn't return a level count (the list cards don't show one). `getClock` treats an id that isn't a uuid as no clock.
- `formatBlindPair` (blinds without the ante) and `formatClockDate` (dates in `America/Chicago`) were added to `format.ts`; `clockStatusLabel` to `clocks.ts`.
- The settings and payout fields were generalized for the create form (`settingsReducer`, `SettingsFields`/`PayoutFields` with an id prefix; the template-only new row lengths moved to `NewRowLengthFields`).
- No haptics: the other admin buttons don't use them.
- Also fixed on the branch: the lockfile pointed 68 packages at an internal npm proxy (Vercel builds failed), and vitest ran the test suites of worktrees under `.claude/`.

**Goal:** An admin creates a clock from a template, runs it from `/admin/clock/[id]` (start, pause, resume, previous/next level, ±1 minute), and anyone can watch the same clock live at `/clock/[id]` on a TV or phone. Timing only; entrants, money and the finish flow come in phases 5 and 7.

**Architecture:** The clock row holds timestamps, not a ticking value. Every screen loads the row, subscribes to it with Supabase Realtime, measures its offset from the database clock with `server_now()`, and works out the level and time left locally every 250 ms with `getClockPosition`. Each admin control is one server action: it reads the row and the database time, asks the phase 2 control function (`startClock`, `pauseClock`, …) for the columns to save, and writes them with a **conditional update** (`where status = <old> and level_index = <old>`), so two admin screens can't both act on a stale clock. The control screen also saves level changes caused by time running out (`catchUpUpdate`), using the same conditional write.

**Tech Stack:** Next.js 16 App Router (server components, server actions, Cache Components), React 19, Supabase JS (`postgres_changes` Realtime, RPC), shadcn/ui (`Card`, `Field`, `Input`, `Select`, `Button`, `AlertDialog`, `Badge`), Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,hooks,actions,data,lib}`; server actions re-check `getCurrentUser().isAdmin` on top of RLS and the `/admin` gate in `utils/supabase/middleware.ts`, and return `{ success, message }`; toasts via `useToast`; Supabase writes to **dev only** until Task 10; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (Clock timing, Screens & routes, Error handling). Earlier phases: `...-phase-1-schema.md`, `...-phase-2-logic.md`, `...-phase-3-templates.md`. Branch: `feat/tournament-shot-clock`.

---

## Decisions made in this plan (confirm before starting)

1. **Timestamps come from the database clock.** Each control action calls `server_now()` alongside reading the row and passes that time to the control function, so every saved time and every screen's countdown use the same clock (the design's rule: never the admin device's clock).
2. **Conditional writes on `status` and `level_index`.** If another screen changed the clock first, the action saves nothing and says "The clock changed on another screen. Try again." Two people pressing +1 minute at the same moment while on the same level can still both apply; that's acceptable.
3. **No tournament link at creation.** `tournament_id` stays null; the finish flow (phase 7) creates or picks the tournament. This keeps the create form short. (The column is already nullable.)
4. **No Finish button yet.** Finishing assigns 1st place to the last player, which needs entrants (phase 5) and the review screen (phase 7). A clock can be deleted from the list instead.
5. **The display page has no header or tab bar.** `/clock/[id]` lives outside the `(home)` route group, so it only gets the root layout: big text, dark, readable across a room. TV mode (fullscreen, wake lock) and sounds stay in phase 6.
6. **Create form**: pick a template, name the clock (defaults to "<template> – <date>"), and adjust buy-in, rebuy, chips, places paid, split and max rebuys (prefilled from the template). Levels can't be edited per clock; change the template first.
7. **Admin nav**: the "Clock" group gets **Clocks** (`/admin/clock`) above **Blind Structures**.
8. **Prod rollout happens at the end (Task 10), only with your go-ahead in chat**: all 11 clock migrations, in order, through the prod MCP.

## Ground rules

- Dev only (`supabase-dev`) until Task 10. The prod MCP stays read-only until you approve Task 10.
- Pure logic in `features/clock/lib/` (no React/Supabase), tests next to it.
- Run the app against dev with `npm run dev`; the dev admin profile can sign in.

## Facts (checked 2026-11-19)

- Dev has all 11 clock migrations; prod has none (latest prod migration: `20261119161608_drop_dead_tournament_functions`).
- `_tournament_clocks` and `_clock_entrants` are in the `supabase_realtime` publication; `select` is open to anon, writes need `is_league_admin()`.
- `public.server_now()` returns `clock_timestamp()` and is callable by anon.
- Nothing in the app uses Realtime yet. Browser client: `utils/supabase/client.ts` (`createClient`, with the session). Cookie-free client: `utils/supabase/public.ts` (`createPublicClient`).
- `next.config.ts` has `cacheComponents: true`: a page that awaits `params` needs a Suspense boundary above it. `app/admin/loading.tsx` gives admin pages one; `/clock/[id]` needs its own `loading.tsx`.
- Phase 2 already provides: `getClockPosition`, `startClock`, `pauseClock`, `resumeClock`, `goToLevel`, `adjustTime`, `catchUpUpdate`, `nextPlayingLevel`, `timeToNextBreakMs`, `serverOffsetMs` (`timing.ts`); `parseLevels`, `levelNumber` (`levels.ts`); `formatClockTime`, `formatBlinds`, `formatDuration` (`format.ts`). Control refusals are `wrong_status` and `level_out_of_range`.
- Phase 3 validation for payouts and money lives in `features/clock/lib/structures.ts` (`validateStructureDraft`, `payoutTotal`, `isCompleteSplit`, `SUGGESTED_SPLITS`); `payout-fields.tsx` edits a `StructureDraft`.

---

### Task 1: Clock settings and the row to insert (pure)

**Files:**
- Create: `features/clock/lib/clocks.ts`, `features/clock/lib/clocks.test.ts`
- Modify (only if needed to share rules): `features/clock/lib/structures.ts`

**Contract:**
- `type ClockSettings = { name: string; buy_in: number; rebuy: number; starting_chips: number; rebuy_chips: number; places_paid: number; payout_pcts: number[]; max_rebuys: number }`.
- `clockSettingsFromStructure(structure: BlindStructure, todayLabel: string): ClockSettings`: copies the template defaults; name is `"<template name> – <todayLabel>"`.
- `validateClockSettings(settings): ClockSettingsError[]`: the same rules and messages as the template editor for money, chips, places paid, split and max rebuys (reuse the phase 3 checks; extract a shared helper from `validateStructureDraft` rather than copying them), plus name required and at most `NAME_MAX_LENGTH`.
- `buildClockInsert(structure: StructureWithLevels, settings: ClockSettings): ClockInsert`: the `_tournament_clocks` columns to insert: `structure_id`, the settings, `levels` = the template's levels as `BlindLevel[]` (kind, blinds, ante, duration, note; no ids or positions), `status: "setup"`, `level_index: 0`, nulls for the timestamps, `tournament_id: null`.

**Test scenarios:**
- NLPT Standard → settings match its defaults; name uses the date label.
- `buildClockInsert` → 19 levels in position order, notes kept on breaks, no `id`/`structure_id`/`position` keys inside levels; passes `parseLevels`.
- Status fields satisfy the database rule for `setup` (no start time, no paused time).
- Validation: blank name, places paid 2, split totalling 95, a negative buy-in → one error each with the template editor's message; valid settings → no errors.

**Commit:** `feat: build tournament clocks from a template`

### Task 2: What the display shows (pure)

**Files:**
- Create: `features/clock/lib/display.ts`, `features/clock/lib/display.test.ts`

**Contract:** `describeClock(clock: TournamentClock, nowMs: number): ClockView`, where `ClockView` is:
- `status`, `position` (from `getClockPosition`)
- `title`: `"Level 5"` or `"Break"`; `note`: the break's note or null
- `blinds`: the current level's `formatBlinds` text (null on a break); `ante` (null when 0)
- `next`: the next playing level's blinds and ante text, or null after the last level
- `nextBreakMs`: `timeToNextBreakMs`, or null
- `timeText`: `formatClockTime(remainingMs)`
- `progress`: elapsed share of the current level, 0–1 (clamped; 0 in setup; time added past the level's length counts as 0)
- `isFinalLevel`, `isOutOfTime` (running on the last level with 0 left)

**Test scenarios** (NLPT Standard fixture, `makeClock`):
- Setup → "Level 1", 100 / 200, next 150 / 300, 20:00, next break in 1h 20m, progress 0.
- Running 25 min after start → "Level 2", 15:00 left.
- During the first break → title "Break", the note, no blinds, next is level 5's blinds, `nextBreakMs` null.
- Paused with 90 s left → "1:30", unchanged however much time passes.
- Last level, past its end → `isOutOfTime`, "0:00", `next` null.

**Commit:** `feat: describe a clock for the display`

### Task 3: Clock data access

**Files:**
- Create: `features/clock/data/clocks.ts`

**Contract** (same `{ data, error }` style as `data/structures.ts`):
- `toClock(row): TournamentClock`: runs `parseLevels` on `levels` and turns `numeric` columns into numbers. A row whose levels don't parse throws, which the page shows through `ErrorHandler`.
- `getClocks(db)`: every clock, newest first: id, name, status, created_at, level count. The list doesn't need the levels.
- `getClock(db, id)`: one clock, or data null.
- `getServerNowMs(db): Promise<number>`: calls `server_now()`.

No unit tests (thin Supabase calls); covered by the click-through in Task 9.

**Commit:** `feat: read tournament clocks`

### Task 4: Create and delete clocks

**Files:**
- Create: `features/clock/actions/clocks.ts`
- Create: `app/admin/clock/page.tsx`, `app/admin/clock/new/page.tsx`
- Create: `features/clock/components/clocks/clock-list.tsx`, `clock-card.tsx`, `delete-clock-button.tsx`, `create-clock-form.tsx`
- Modify: `components/admin-nav/admin-links.tsx` (add **Clocks**)

**Actions** (admin check first; `{ success, message, id? }`):
- `createClockAction(structureId, settings)`: validates with `validateClockSettings`, loads the template, inserts `buildClockInsert(...)`, revalidates `/admin/clock`, returns the new id. The form then routes to `/admin/clock/<id>`.
- `deleteClockAction(id)`: deletes the row (entrants cascade), revalidates.

**Screens:**
- `/admin/clock`: cards showing name, status badge (Not started / Running / Paused / Finished), created date, with links **Control** and **Display**, and delete with an `AlertDialog`. A **New clock** button. Empty state when there are none.
- `/admin/clock/new`: a template `Select` (NLPT Standard first if present). Choosing one fills in the settings. Fields: name, then the money, chips and max rebuys fields and the payout fields. Reuse `CompactField`, `NumberInput` and `ErrorText`, and make `PayoutFields` work on the settings shape (generalize its props rather than copying it). A summary line shows the template's levels, breaks and length (`summarizeLevels`). **Create clock** submits.

**Verify:** create a clock on dev, check the row (status `setup`, 19 levels with notes, settings as entered); a bad split shows the error and creates nothing; delete removes it.

**Commit:** `feat: create and delete tournament clocks`

### Task 5: Clock controls (server actions)

**Files:**
- Create: `features/clock/lib/controls.ts`, `features/clock/lib/controls.test.ts`
- Modify: `features/clock/actions/clocks.ts`

**Pure part (`controls.ts`):**
- `type ClockControl = { type: "start" } | { type: "pause" } | { type: "resume" } | { type: "next" } | { type: "previous" } | { type: "adjust"; minutes: 1 | -1 }`.
- `planControl(clock, control, nowMs): Result<ClockUpdate, ClockControlRefusal>`: dispatches to the phase 2 functions. Next and previous go from the **caught-up** level (`getClockPosition(...).levelIndex ± 1`), not the saved one.
- `controlRefusalMessage(reason): string`: "The clock isn't in a state for that." / "There's no level that way."

**Tests:** each control on a fixture clock gives the phase 2 result; "next" while running 45 min in goes from level 3 to level 4, not 1 → 2; "previous" on level 1 → `level_out_of_range`; "pause" during setup → `wrong_status`.

**Actions:**
- `controlClockAction(id, control)`: admin check → read the clock and `server_now()` in parallel → `planControl` → refusal: return its message. Otherwise `update(...).eq("id", id).eq("status", old.status).eq("level_index", old.level_index).select().maybeSingle()`. No row back means "The clock changed on another screen. Try again." On success return the saved row so the screen updates at once, before the Realtime event arrives.
- `catchUpClockAction(id, expectedLevelIndex)`: reads the clock and the time, `catchUpUpdate`, and writes only where `level_index = expectedLevelIndex` and status is `running`. Returns success with nothing saved when there's nothing to do or another screen already did it; that isn't an error.
- Neither action revalidates paths: screens get changes over Realtime. Revalidate `/admin/clock` only when the status changes, so the list's badge stays right.

**Verify on dev:** start, pause, resume, next, previous and ±1 min each change the row as the design's Clock timing section says; a second, stale request is refused with the "changed on another screen" message.

**Commit:** `feat: control tournament clocks with conditional writes`

### Task 6: `useClock` hook (live state)

**Files:**
- Create: `features/clock/hooks/use-clock.ts`
- Create: `features/clock/hooks/use-server-offset.ts`

**Contract:** `useClock(initialClock: TournamentClock): { clock; view: ClockView; nowMs; connection: "live" | "reconnecting"; applyRow(row) }`

**Behaviour:**
- **Server offset:** on mount, on reconnect, and when the tab becomes visible again, call `server_now()` with the browser client, timing the round trip; `serverOffsetMs` gives the offset. Until the first answer, use 0.
- **Tick:** `setInterval` every 250 ms sets `nowMs = Date.now() + offset`; `view = describeClock(clock, nowMs)`. Clear it on unmount.
- **Realtime:** one channel per clock, `postgres_changes` on `_tournament_clocks` with `filter: id=eq.<id>`, events `UPDATE` and `DELETE`. Pass updates through `toClock`. On delete, show "This clock was deleted".
- **Reconnect:** the subscribe callback's status: anything but `SUBSCRIBED` sets `connection: "reconnecting"`. Each time it becomes `SUBSCRIBED` (including the first time), refetch the row (Realtime doesn't replay missed events) and resync the offset.
- **Waking:** on `visibilitychange` to visible, refetch and resync too, so a phone that slept shows the right time straight away.
- `applyRow` lets the control screen apply the row an action returned without waiting for Realtime. Ignore a row older than the current one: compare `level_index`/`status`, otherwise newest wins. Keep this simple: Realtime brings the same row a moment later.
- Uses the session browser client (`utils/supabase/client.ts`); anon can read, so it works signed out.

**Verify:** manual, in Task 9. The hook only wires tested pieces together; put any decision logic worth testing (for example "is this row newer") in a small pure function in `display.ts` or `controls.ts` with a test.

**Commit:** `feat: keep a clock live with Realtime and server time`

### Task 7: Public display `/clock/[id]`

**Files:**
- Create: `app/clock/[id]/page.tsx`, `app/clock/[id]/loading.tsx`
- Create: `features/clock/components/display/clock-display.tsx` (client: uses `useClock`)
- Create: `features/clock/components/display/clock-face.tsx` (presentational: takes a `ClockView`; reused by the control screen)

**Page:** reads the clock with `createPublicClient` (no cookies, works signed out); `notFound()` when it's missing; error through `ErrorHandler`. Add `metadata` with the clock's name as the title.

**Clock face, largest first:**
- Countdown (`timeText`), huge and tabular, scaling with the viewport (`clamp()`/`vw`), and readable from across a room on a TV
- Title (Level N / Break with the coffee icon and the note); current blinds and ante
- A thin progress bar for the level
- "Next: 1,500 / 3,000" and "Break in 42:10"
- Status overlay: **Not started**, **Paused** (countdown dimmed), **Finished**
- A small **Reconnecting…** badge while `connection` isn't live
- On the last level once time runs out, show 0:00 and "Final level" (no wrap)

Layout works on a phone in portrait and a TV in landscape; no horizontal scroll. Dark background from the theme tokens.

**Verify:** open signed out in a private window; setup, running, paused and break each look right on a phone and a desktop width.

**Commit:** `feat: show a live tournament clock display`

### Task 8: Admin control screen `/admin/clock/[id]`

**Files:**
- Create: `app/admin/clock/[id]/page.tsx`
- Create: `features/clock/components/control/clock-controls.tsx` (client)
- Create: `features/clock/components/control/control-buttons.tsx`
- Create: `features/clock/components/control/use-catch-up.ts` (or inside `clock-controls.tsx` if it's small)

**Screen:**
- The `ClockFace` (smaller) at the top, from `useClock`, with a link to open the display in a new tab and a **Copy display link** button.
- Buttons, large and thumb-friendly; only the ones that apply are enabled:
  - **Start** (setup)
  - **Pause** / **Resume** (one main button that switches)
  - **Previous level** / **Next level**
  - **−1 min** / **+1 min**
- Each press calls `controlClockAction` inside `useTransition`, disables the buttons while it's pending, applies the returned row with `applyRow`, and shows a toast with the message on failure. Haptic tap via `lib/haptics.ts` if the other admin buttons use it.
- **Catch-up:** when `view.position.levelIndex` is past `clock.level_index` while running, call `catchUpClockAction(id, clock.level_index)` once for that level index (remember the last one sent so it isn't retried every tick).
- Previous/next while running ask for no confirmation, but Start does (an `AlertDialog`: "Start the clock? Level 1 begins now.").

**Verify:** in Task 9.

**Commit:** `feat: control a tournament clock from the admin screen`

### Task 9: Two-screen click-through on dev

Run `npm run dev`. Use the admin control in one browser and the display, signed out, in another (or a phone on the LAN). Confirm the browser to use with the user first.

- Create a clock from NLPT Standard; it appears in the list as Not started.
- Start → both screens count down within about a second of each other.
- Pause / Resume → the display follows within about 1 s; time left is the same on both.
- Next / Previous / ±1 min → both update; the times match.
- Refresh the display mid-level → it shows the right time straight away.
- Set a level to 1 minute (on a test template) and let it run out → both advance, and the row's `level_index` is saved once (check on dev), with two admin tabs open.
- Break → title, note and "Next" are right.
- Disconnect (DevTools offline) → **Reconnecting…**; back online → it clears and the time is right.
- Two admin tabs: pause in one, then press pause in the other without refreshing → the "changed on another screen" message (if the second tab hasn't picked up the change by then).
- Delete the test clocks and templates afterwards.

Fix anything found (with a test where the bug is in `lib/`); commit each fix separately.

### Task 10: Prod rollout (only with your go-ahead)

**Ask the user in chat first** and wait for a clear yes. Then:
1. Check prod's migration list again: the clock migrations are still missing and nothing else has changed.
2. Apply the 11 clock migrations to prod **in order** through the prod MCP, using the repo files verbatim and their file names as migration names: `20261119163253_tournament_clock_schema` … `20261119192537_blind_level_break_notes`. If one fails, stop and report; don't edit and retry without asking.
3. Verify on prod (read-only queries): the four tables exist with RLS on; the publication includes `_tournament_clocks` and `_clock_entrants`; `server_now()` answers as anon; NLPT Standard has 19 levels and payout `{55,30,15}`; `get_advisors` (security) shows nothing new for these tables.
4. Prod's `list_migrations` versions match the repo file names.

The app code reaches prod when the PR merges; the tables are additive and unused until then.

### Task 11: Docs

- Update `docs/plans/2026-11-18-tournament-clock-design.md`: phase 4 done; the decisions above (database time for actions, conditional writes, no link at creation, no finish yet); the display page outside `(home)`.
- Mark Task 10 done (or still pending) in this plan.

**Commit:** `docs: record clock phase 4 decisions`

---

## Refinement pass

### Task R1: Lint and format
**Skill:** lint-and-format. Prettier and `npm run lint -- --fix` on the changed files; `npx tsc --noEmit` (ignoring `.next/` noise); `npm test`.
Commit: `style: lint and format clock phase 4`

### Task R2: Reduce complexity
**Skill:** reduce-complexity. Watch `clock-controls.tsx`, `clock-face.tsx` and `use-clock.ts` for long functions and nesting.
Commit: `refactor: reduce complexity in the clock screens`

### Task R3: Improve readability
**Skill:** improve-readability. Names, magic numbers (tick interval, font scales), unclear expressions.
Commit: `refactor: clarify the clock screens`

### Task R4: Make it DRY
**Skill:** make-it-dry. Look especially at the settings and payout fields shared by the template editor and the create form, and at action boilerplate (admin check, result shape) shared by `actions/structures.ts` and `actions/clocks.ts`.
Commit: `refactor: share <what> between <where>`

### Task R5: Standards alignment
**Skill:** standards-alignment. Explicit return types on exports, labels on icon-only buttons, no `console.log`.
Commit: `refactor: align clock phase 4 with standards`

Skip any refinement task that finds nothing; no empty commits.
