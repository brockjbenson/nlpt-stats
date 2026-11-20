# Tournament Clock Phase 8 (Nav) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Players can find a running clock without being sent a link: a "Tournament live" banner shows on the league pages while a clock is running or paused, and a tournament saved from a clock links back to it.

**Architecture:** A client hook (`useLiveClock`) loads the running and paused clocks with the browser Supabase client, subscribes to every change on `_tournament_clocks` over Realtime, and reloads (debounced) when anything changes or the tab comes back into view. A pure helper picks the clock to show. The banner renders through the existing `BottomTabAccessory` (the iOS-style capsule above the tab bar on phones, floating at the bottom on desktop) in the `(home)` layout, and links to the public display. The tournament page reads the linked clock id through a cached league query, which phase 7's save already invalidates.

**Tech Stack:** Next.js 16 (Cache Components), React 19, Supabase (Realtime `postgres_changes`), Motion/Tailwind, Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,hooks,data,lib}`; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (Implementation phases, item 8). Earlier phases: `...-phase-4-clock-core.md` through `...-phase-7-finish-flow.md`. Branch: `feat/tournament-shot-clock`.

**Status (2026-11-20):** Tasks 1–6 are done on dev; the refinement pass is next. No migration.

**Changes from this plan:**
- **`useLiveClock` loads on mount as well as on every (re)subscribe.** At first it loaded only once Realtime said it was subscribed, and on the first check no banner showed: nothing had been fetched. Loading straight away also covers a network that blocks websockets.
- **`LIVE_STATUSES` lives in `lib/live.ts`**: the query and the picking use one list, whose order (running, then paused) is the preference.
- **`useServerNow` is exported from `use-clock.ts`** so the banner counts down exactly as the display does.
- **Task 5 ran in iframes**: the browser window wouldn't resize, so the league page was loaded in a 390 px iframe beside the control screen in a second one, driven with scripted clicks. Every step passed: the banner appeared within ~3 s of Start (preferring the running clock over two paused ones), showed Paused, the level, and Break, moved inline when the tab bar minimized, wasn't on admin pages, and dropped the clock the moment it ended. Saving the results gave the tournament page its "View clock" link; deleting the clock removed it. Signed-out reads were checked with the anon role in SQL rather than a signed-out browser. The test clock and tournament were deleted and week 30's rankings recalculated.
- **Two paused clocks from earlier testing ("Thanksgiving Showdown 2026" and "NLPT Standard – Nov 19, 2026") are on dev**, so the banner shows "Paused" on staging until they're finished or deleted. While checking, the second one was briefly started by SQL; it was put back paused with a full level 6 (20:00), since its earlier time wasn't recorded.

---

## Decisions made in this plan (confirm before starting)

1. **The admin nav link is already done** (phases 3–4: Clocks and Blind Structures in the admin menu). Nothing to add.
2. **The banner shows for running and paused clocks**, not for setup or finished ones. A paused clock is usually on a break or a short stop, and players still want to find it. It says "Paused" instead of counting down.
3. **It links everyone to the public display** (`/clock/[id]`). Admins reach the control screen from the admin menu or the display's own controls; one link keeps the banner simple.
4. **It disappears as soon as the clock finishes** (or is deleted), live, without a refresh.
5. **Where it shows:** the league pages (the `(home)` layout), as a bottom tab accessory. **Not** on admin pages: the structure editor, new-clock form and cash session form already use the accessory slot there, and only one accessory shows at a time. **Not** on the display itself (it has its own layout).
6. **What it shows:**
   - Above the tab bar ("expanded"): a pulsing red dot, "Tournament live", the clock's name, and the level with its time left (e.g. "Level 5 · 12:34") or "Break · 4:10" / "Paused".
   - Beside the small capsule ("inline", once the tab bar minimizes on scroll): the dot and the time left (or "Paused").
7. **Two clocks live at once** (rare): show one. Running beats paused; then the newest. No "+1 more".
8. **Tournament page:** a tournament saved from a clock shows a "Played on the clock" row with a "View clock" link to the display. Manually entered tournaments don't show it.
9. **No database changes.** `_tournament_clocks` is already readable by anon and in the Realtime publication (phase 1), so nothing new goes to prod for this phase.

## Ground rules

- No migration. Test clocks created on dev for the click-through get deleted afterwards.
- Pure logic in `features/clock/lib/`, tests next to it.
- The banner must not delay the prebuilt league pages: it's a client component that loads after the page shows, and renders nothing until it knows a clock is live.

## Facts (checked 2026-11-20)

- `ClockStatus = "setup" | "running" | "paused" | "finished"` (`features/clock/types.ts`).
- `_tournament_clocks` RLS: "public read" for anon and "members read" for authenticated (`20261119163443_tournament_clock_access.sql`); it's in the `supabase_realtime` publication (the display already subscribes signed out).
- `useClock` (`features/clock/hooks/use-clock.ts`) subscribes to one clock (`filter: id=eq.<id>`) and computes time with `useServerOffset` and `getClockPosition`. `describeClock` (`features/clock/lib/display.ts`) builds the display's level and time text. `toClock` / `ClockRow` (`features/clock/data/clocks.ts`) turn rows into `TournamentClock`. `useOnVisible` exists (`features/clock/hooks/use-on-visible.ts`).
- `BottomTabAccessory` (`components/bottom-tabs/accessory.tsx`) takes children or `(placement: "expanded" | "inline") => ReactNode`; it registers itself on mount (`addAccessory`), so rendering it only while a clock is live leaves the tab bar untouched otherwise. Current users are all admin pages: `features/clock/components/structures/structure-editor.tsx`, `features/clock/components/clocks/create-clock-form.tsx`, `features/admin/components/cash/new-session/floating-add-button.tsx`.
- `app/(home)/layout.tsx` renders `Header`, `MainWrapper` and `BottomTabs`; `app/admin/layout.tsx` is a copy of it.
- Tournament page: `app/(home)/tournaments/[year]/[id]/page.tsx` (prebuilt via `generateStaticParams`) → `_components/main.tsx` → `getMajorData(id)` (`lib/data/league.ts`, a `leagueQuery` cached under `LEAGUE_DATA_TAG`) → `_components/tournament-info-card.tsx`.
- Saving clock results calls `refreshAfterTournamentSave`, which runs `updateTag(LEAGUE_DATA_TAG)`. `deleteClockAction` (`features/clock/actions/clocks.ts`) doesn't touch that tag today.
- Paths: `clockDisplayPath(id)` in `features/clock/lib/paths.ts`.

---

### Task 1: Pick the live clock (pure)

**Files:**
- Create: `features/clock/lib/live.ts`
- Test: `features/clock/lib/live.test.ts`

**Responsibility:** Decide which clock the banner shows, and what it says.

**Interface:**
- `pickLiveClock(clocks: TournamentClock[]): TournamentClock | null`: only `running` or `paused`; running before paused; then newest `created_at` first.
- `describeLiveClock(clock: TournamentClock, nowMs: number): LiveClockText` where `LiveClockText = { name: string; detail: string; time: string | null }`. `detail` is "Level 5", "Break" or "Paused"; `time` is the countdown ("12:34") while running, `null` while paused. Reuse `getClockPosition` and the display's time formatting (`describeClock` or `format.ts`); don't write a second formatter.

**Test scenarios:**
- Empty list, or only setup/finished clocks → `null`.
- One paused and one running → the running one, even if the paused one is newer.
- Two running → the newer one.
- Running on level 5 with 12m34s left → `{ detail: "Level 5", time: "12:34" }`.
- Running on a break → `detail: "Break"`.
- Paused → `{ detail: "Paused", time: null }`.
- Running past the last level (caught up to the end) → doesn't throw; shows the last level with 0:00.

**Steps:** write the tests, see them fail, implement, see them pass, `npm run lint`, commit `feat: pick the clock the live banner shows`.

### Task 2: Load the live clocks and keep them current

**Files:**
- Modify: `features/clock/data/clocks.ts` (add `getLiveClocks`)
- Test: `features/clock/data/clocks.test.ts` (if the existing tests mock the client this way; otherwise leave it to the click-through)
- Create: `features/clock/hooks/use-live-clock.ts`

**Responsibility:**
- `getLiveClocks(db: SupabaseClient): Promise<TournamentClock[]>`: every clock whose status is running or paused, through `toClock`. On error, log it and return `[]` (the banner just doesn't show).
- `useLiveClock(): TournamentClock | null`: loads with the browser client on mount; subscribes to `postgres_changes` on `_tournament_clocks` (all events, no filter, its own channel name, e.g. `live-clocks`); on any event, reloads after a short debounce (reuse the 1 s `RESYNC_DELAY_MS` idea from `use-entrants.ts`) rather than merging rows, since a status change can add or remove a clock; reloads when the tab becomes visible (`useOnVisible`); removes the channel on unmount. Returns `pickLiveClock(clocks)`.

**Notes:** Under Cache Components the `(home)` layout can stay hidden in `<Activity>` and come back; effects clean up and re-run, so the subscription must be set up and torn down entirely in the effect (no module-level channel).

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: keep the live clock current over Realtime`.

### Task 3: The banner

**Files:**
- Create: `features/clock/components/live/live-clock-banner.tsx`
- Modify: `app/(home)/layout.tsx`

**Responsibility:** While `useLiveClock()` returns a clock, render a `BottomTabAccessory` whose content is a `Link` to `clockDisplayPath(clock.id)`:
- Expanded: pulsing red dot, "Tournament live" (small, muted) over the clock's name, and the detail and time on the right ("Level 5 · 12:34", "Break · 4:10", "Paused").
- Inline: the dot and the time (or "Paused").
- Ticks once a second while running (with `useServerOffset` so it matches the display), not while paused. Respect `prefers-reduced-motion` for the pulse.
- Renders nothing (no accessory) when there's no live clock.
- Accessible name on the link, e.g. "Tournament live: Thanksgiving Showdown, level 5, 12:34 left".

Render `<LiveClockBanner />` in `app/(home)/layout.tsx` (inside the layout, alongside `BottomTabs`). Not in `app/admin/layout.tsx` (see decision 5).

**Check:** with no clock running, the league pages look exactly as before (no empty capsule, no layout shift, `--accessory-space` stays 0).

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: show a Tournament live banner on the league pages`.

### Task 4: Link a tournament to its clock

**Files:**
- Modify: `lib/data/league.ts` (or a new `features/clock/data/tournament-clock.ts` wrapped in `leagueQuery`): `getTournamentClockId(tournamentId: string)` → the id of the clock whose `tournament_id` is that tournament, or `null`. Cached under `LEAGUE_DATA_TAG` like `getMajorData`.
- Modify: `app/(home)/tournaments/[year]/[id]/_components/main.tsx` (load it alongside the tournament) and `_components/tournament-info-card.tsx` (a "Played on the clock" row with a "View clock" link to `clockDisplayPath(id)`, only when there is one).
- Modify: `features/clock/actions/clocks.ts`: `deleteClockAction` runs `updateTag(LEAGUE_DATA_TAG)` when the deleted clock had a tournament, so the page doesn't link to a missing clock.

**Notes:** Saving results already clears `LEAGUE_DATA_TAG`, so a newly saved tournament picks up the link. A failed lookup just hides the row; it never breaks the tournament page. Leave the page's existing date bug alone (separate fix to `master`).

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: link a tournament saved from a clock back to the clock`.

### Task 5: Click-through on dev

With the dev server and Browser 1 (scripted clicks where the mouse doesn't reach the page):
1. No clock live: home, NLPI, tournaments pages show no banner; the tab bar looks as before.
2. Create a test clock with a few players and start it: the banner appears on an open league page within a couple of seconds without a refresh, counting down in step with `/clock/[id]`.
3. Scroll until the tab bar minimizes: the banner moves inline and shows just the time.
4. Pause → "Paused"; resume → counting again; skip to a break → "Break".
5. Tap the banner → the display.
6. Signed out (a private window or after signing out): the banner still shows and links.
7. Admin pages (`/admin/clock/structures/...`, new clock form): no live banner; their own accessory still works.
8. Finish the clock → the banner disappears. Save the results → the tournament page shows "View clock", which opens the display.
9. Phone width (390 px): the banner fits on one line, with long names cut off with an ellipsis.
10. Clean up: delete the test tournament and clock, and recalc that week's rankings (as in phase 7's click-through).

Record anything that differed in the plan's status line. No commit unless fixes were needed.

### Task 6: Docs

- This plan: status line and "Changes from this plan".
- Design doc: phase 8 built on dev; status line updated (phases 1–8); note phase 8 has no migration.
- Commit `docs: record clock phase 8`.

## Refinement pass

R1–R5 as in earlier phases (lint and format, reduce complexity, readability, DRY, standards alignment), each its own commit, skipped when it finds nothing. Watch for in R4: the countdown formatting and the debounced reload, which `use-entrants.ts` and `use-clock.ts` may already share a shape with.

## After phase 8

The clock feature is complete on dev. Left:
- Merge into `staging` and check on the phone.
- The prod rollout of all 13 clock migrations (phase 4's Task 10), with the user's go-ahead.
- The feature PR for `feat/tournament-shot-clock` to `master`.
