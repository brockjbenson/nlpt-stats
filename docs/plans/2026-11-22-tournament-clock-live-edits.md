# Tournament Clock Live Edits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** An admin can fix a running clock without starting over: edit its settings, take away an accidental rebuy, change who knocked a player out, and edit the current and upcoming blind levels.

**Architecture:** Each edit gets a pure planner in `features/clock/lib` (what's allowed and what to save) and an admin-checked server action that writes with a conditional update, as the existing controls do. Settings and player fixes are drawers on the control screen (like the Payouts drawer). Levels get their own page, `/admin/clock/[id]/levels`, which reuses the template editor's level list with played rows locked. No database changes: Realtime already carries all three tables to every screen.

**Tech Stack:** Next.js 16 (Cache Components), React 19, Supabase (RLS, Realtime), dnd-kit, vaul drawers, Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,hooks,actions,data,lib}`; server actions re-check `isAdmin()` and return `{ success, message }`; conditional updates for anything another screen could change first; toasts via `useToast` / `useActionWithToast` / `usePlayerAction`; Supabase writes to **dev only**; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-22-tournament-clock-live-edits-design.md`. Clock reference: `docs/plans/2026-11-18-tournament-clock-design.md`. Branch: `feat/clock-live-edits`.

**Status (2026-11-22):** Tasks 1–11 and the refinement pass are done on dev and in PR #31 (into `staging`). 553 tests pass (473 before). No migration. Built with a fresh implementer per task, each reviewed for spec and then code quality, and every review note was fixed.

**Changes from this plan:**
- **Lint:** the repo has no `npm run lint` script, so lint was `npx eslint` on the changed files.
- **Validation (Task 3):** `validateSettings` is now `validateDetails` (name, money, chips, max rebuys) plus `validatePayouts`. Nothing depended on the old order.
- **One stored-level mapper:** `toStoredLevel` in `lib/levels.ts` is used by both the template save and `planLevelEdit`.
- **Shared messages:** "The players changed on another screen. Try again." lives in one place (`PLAYERS_CHANGED_ELSEWHERE`).
- **Removed knocker:** `changeKnockerAction` treats a removed knocker (foreign-key error) as "changed on another screen", not "can't be removed".
- **Locked rows (Task 8):** they aren't drop targets either, so a drag stops at the first upcoming row instead of being thrown away. The current row's marker is a short "Now" so the blinds still fit at phone width. Played rows read ", played" to screen readers.
- **Edit player (Task 7):**
  - The drawer always has a way out: Done, or Cancel next to Save.
  - The name button holds only inline elements and keeps the row's details for screen readers.
  - Knocker choices are in name order.
  - It closes if the player goes or the clock finishes.
- **Edit levels (Task 9), from review:**
  - **Rows realign when the clock moves on.** Rows locked by position kept the draft's content, so after two or more level changes during an edit a save could duplicate or drop a level. Now, when the live level changes, the rows realign by identity (`alignDraftToClock`, `savedRowKey`): played rows show what was actually played, the current row is the level really being played (with any edits to it), and the rest keep the admin's order.
  - **A fresh draft per visit.** Cache Components keeps a page you leave mounted, so an abandoned draft came back. The editor is now keyed by the page's server time.
  - **Back link confirms.** It asks before discarding edits, through a shared `BackLink` that replaces `BackToStructuresLink`.
  - `NewRowLengthFields` isn't shown: new rows open expanded, with the clock's most common lengths.
  - `useLeaveWarning` was extracted for both editors.
- **Concurrent saves (decision 3):** the server reads the clock when Save is pressed. A ±1 min or pause pressed earlier is kept (checked: a +1 min from another screen survived a levels save). The "changed on another screen" refusal covers only the moment between that read and the write.
- **Task 10 in automation:** keyboard drag-and-drop needs a short pause between key presses.
- **Refinement:**
  - R1: found nothing.
  - R2: a shared knocker lookup in the drawer. The editor still re-renders every 250 ms through `useClock`; leaving it saved changing a shared hook.
  - R3: a clearer save label and up-to-date comments.
  - R4:
    - `formatLevelsSummary` replaces four copies.
    - Added `clockDetailsOf`.
    - `updatePayoutsAction` moved to `actions/clocks.ts` and shares `updateUnfinishedClock` and one result type with the settings save.
    - Skipped: merging `toClockLevel` (different rules) and a shared drawer footer (the three differ).
  - R5: one missing return type.
- **Outside the plan:**
  - Bottom sheets now stay above the on-screen keyboard app-wide (`components/ui/drawer.tsx`, `hooks/use-keyboard-inset.ts`, `lib/keyboard-inset.ts`). vaul's own `repositionInputs` is off because it misplaces the sheet on iOS. Checked with a simulated keyboard and on the iPhone.
  - vaul 1.1.2 is its newest release, and the project is unmaintained.

**Known limits:**
- Two screens saving levels at the same moment: the last save wins. A levels page left open while another screen saves levels lines rows up against the old list.
- Taking away a re-entry rebuy doesn't put the player back out (see the design).
- The display's browser tab keeps the old name until it reloads.

**Test clocks on dev:** "Live Edit Renamed" (finished) and "Keyboard Test" (not started). Delete them once phone testing is done.

---

## Decisions made in this plan (confirm before starting)

1. **Saving levels returns to the control screen**, with the saved clock shown at once. The admin edited levels to get back to running the tournament.
2. **The current level's row stays where it is.** The page sends the whole list; the server keeps rows `0 … current − 1` from what's saved and treats the sent row at the current index as the current level. If the sent list has no row at that index (the clock moved on past the end of what the page sent), the save is refused as "changed on another screen".
3. **The levels save is conditional on status, level and the timing column**, so a ±1 min pressed elsewhere in the same moment isn't overwritten.
4. **Settings validation reuses `validateSettings`**; the drawer's state is a full `ClockSettings` (payouts from the saved clock), and only name, money, chips and max rebuys are sent.
5. **Knocked out by saves with a Save button** in the Edit player drawer; **Take away a rebuy saves on tap** (it's one small step, like Rebuy) and the drawer stays open showing the new count.
6. **Templates stay as they are.** The level editor is generalised so templates and clocks share it, with no change in how the template editor behaves.

## Ground rules

- No migration. Test clocks made on dev for the click-through are deleted afterwards.
- Pure logic in `features/clock/lib/`, tests next to it (`*.test.ts`), builders in `test-fixtures.ts`.
- Every new action: `if (!(await isAdmin())) return NOT_ADMIN;`, try/catch with a `Couldn't …` message, conditional update, return the saved rows so the screen shows them before Realtime.

## Facts (checked 2026-11-22)

- `_tournament_clocks.levels` is a jsonb snapshot; `toClock` / `ClockRow` (`features/clock/data/clocks.ts`) parse it with `parseLevels`. `mergeClockRow` applies Realtime updates.
- Timing: `getClockPosition(clock, nowMs)` → `{ levelIndex, levelStartedAtMs, remainingMs, isLastLevel }`; `ClockUpdate` is the `status | level_index | level_started_at | paused_remaining_ms` subset; `levelDurationMs(level)` in `lib/levels.ts`; `levelProblem(row)` checks one level. All in `features/clock/lib/timing.ts` / `levels.ts`.
- `satisfiesStatusRule(clock)` is a private helper in `features/clock/lib/timing.test.ts`.
- Actions: `features/clock/actions/clocks.ts` has `loadClockAndTime(id)` (clock + `getServerNowMs`), `applyControl` (conditional on `status` and `level_index`), `CHANGED_ELSEWHERE`, `CLOCK_GONE`, `NOT_ADMIN`, `revalidatePath(CLOCKS_PATH)` when the list changes. `features/clock/actions/entrants.ts` has `changePlayers(clockId, task, change)`, `savedPlayers`, `writeFailure`, `rebuyEntrantAction` (conditional on `rebuys` and the bust columns), `updatePayoutsAction` (`.neq("status", "finished")`).
- Settings: `ClockSettings` (`lib/clocks.ts`) = `SettingsFields` (`lib/structures.ts`: name, buy_in, rebuy, starting_chips, rebuy_chips, places_paid, payout_pcts, max_rebuys). `validateClockSettings` → `validateSettings(settings, "clock")`. `settingsReducer<T>` in `lib/structure-editor.ts`. `SettingsFields` component (`components/structures/settings-fields.tsx`) renders name, money, chips and max rebuys with their errors. `payouts-card.tsx` has a private `settingsOf(clock)`.
- Players: `PlayerRow` component (`components/players/player-row.tsx`) shows name, badges and buttons; `PlayersCard` (`players-card.tsx`) has `latestKnockers(knockouts)` and opens `BustDialog` (`playersIn` filtered to others, "Not recorded" option). `planRebuy` in `lib/entrants.ts`; refusal messages in `lib/player-messages.ts`; `usePlayerAction` runs an action with a toast.
- `_clock_knockouts`: admin insert/update/delete policies exist (`20261120043702_tournament_clock_knockouts.sql`), `knocked_out_by` can't be the player (`clock_knockouts_not_self_check`), same-clock foreign keys. `useEntrants` applies INSERT/UPDATE/DELETE on entrants and knockouts through `applyRowChange` (`data/entrants.ts`).
- Level editor: `LevelsFields` (`components/structures/levels-fields.tsx`, props `draft: StructureDraft`, `errors`, `dispatch: Dispatch<StructureEditorAction>`, `nextKey`) renders `LevelRow`s in a dnd-kit `SortableContext`, Add Level / Add Break. `LevelRow` takes `canRemove`, `isExpanded`, `onToggle`. `structureEditorReducer` handles `addLevel`, `addBreak`, `updateLevel`, `reorderLevel`, `removeLevel` and the `new_level_seconds` / `new_break_seconds` fields; `suggestLevel` builds a new level from the last one. `structureToDraft` sets the new-row lengths with `mostCommonSeconds`. `structure-editor.tsx` warns on `beforeunload` while dirty and puts Save in a `BottomTabAccessory`. `levelErrors(levels)` in `lib/structures.ts` is private and typed on `DraftLevel[]`; `summarizeLevels(levels)` → `{ levelCount, breakCount, lengthMs }`.
- Paths: `lib/paths.ts` (`clockControlPath`, `clockDisplayPath`, `clockFinishPath`). Admin routes under `/admin` are already gated.

---

### Task 1: Level edit rules (pure)

**Files:**
- Create: `features/clock/lib/level-edits.ts`
- Test: `features/clock/lib/level-edits.test.ts`
- Modify: `features/clock/lib/test-fixtures.ts` (move `satisfiesStatusRule` here from `timing.test.ts`, export it, and import it in both tests)
- Modify: `features/clock/lib/structures.ts` (export the level checks as `validateLevels(levels: BlindLevel[]): StructureError[]`, widened from `DraftLevel[]`; `levelErrors` callers keep working)

**Responsibility:** Decide which rows of a clock's levels can change, and what saving an edited list writes.

**Interface:**
- `type LevelLocks = { firstEditable: number; firstMovable: number }`.
- `levelEditLocks(status: ClockStatus, currentIndex: number): LevelLocks | null`: setup → `{ 0, 0 }`; running or paused → `{ currentIndex, currentIndex + 1 }`; finished → `null`.
- `type LevelEdit = ClockUpdate & { levels: BlindLevel[] }`.
- `type LevelEditRefusal = "finished" | "invalid_levels" | "clock_moved"`.
- `planLevelEdit(clock: TournamentClock, levels: BlindLevel[], nowMs: number): Result<LevelEdit, LevelEditRefusal>`.

**Key logic** (design doc, "What a save does"):
- Finished → `finished`. Setup → the sent list as is (checked), `level_index: 0`, no timing columns.
- Running or paused: `c = getClockPosition(clock, nowMs).levelIndex`. No sent row at `c` → `clock_moved`. `merged = [...clock.levels.slice(0, c), ...levels.slice(c)]`; `validateLevels(merged)` not empty → `invalid_levels`.
- Running: `played = nowMs − position.levelStartedAtMs` (negative when time was added). If `played < newLength` keep `level_started_at` at the effective start; otherwise `level_started_at = nowMs − newLength`. `level_index: c`, status unchanged.
- Paused: `played = levelDurationMs(clock.levels[c]) − paused_remaining_ms`; `paused_remaining_ms = max(0, newLength − played)`; `level_index: c`.
- Strip editor-only fields (`key`) from what's saved; keep `note` only on breaks that have one (as `toClockLevel` does).

**Test scenarios:**
- `levelEditLocks` for each status.
- Setup: reordered and shortened list saved whole; a bad row → `invalid_levels`; no playing level → `invalid_levels`.
- Running 5 min into a 20 min level 3: lengthened to 30 → 25 min left; shortened to 10 → 5 min left; shortened to 4 → level ends now (next level full time at `nowMs`).
- Running with +2 min added (start in the future) → the extra time is kept after a length change.
- Paused with 12 min left of 20, lengthened to 25 → 17 min left; shortened to 5 → 0 left.
- Played rows sent changed → saved rows kept.
- Every upcoming row removed → current is the last level; clock at 0:00 when it runs out.
- Saved `level_index` behind the effective level (no admin open) → catches up; the row at the effective index is current.
- Sent list too short for the current index → `clock_moved`. Finished → `finished`.
- Every result passes `satisfiesStatusRule`.

**Steps:** write the tests, see them fail, implement, see them pass, `npm test`, `npm run lint`, commit `feat: rules for editing a running clock's levels`.

### Task 2: Player fix rules (pure)

**Files:**
- Modify: `features/clock/lib/players.ts`
- Modify: `features/clock/lib/player-messages.ts`
- Test: `features/clock/lib/players.test.ts`, `features/clock/lib/player-messages.test.ts`

**Responsibility:** Whether a rebuy can be taken away, who can be named as a player's knocker, and which knockout row a change updates.

**Interface:**
- `planTakeAwayRebuy(clock: Pick<TournamentClock, "status">, entrants: ClockEntrant[], entrantId: string): Result<{ rebuys: number }, "not_found" | "finished" | "no_rebuys">`.
- `knockerChoices(entrants: ClockEntrant[], entrantId: string): ClockEntrant[]`: everyone except the player who is still in, or out with a better (lower) `finish_place` than the player. Empty for a player still in.
- `planChangeKnocker(clock, entrants, knockouts: ClockKnockout[], entrantId: string, knockedOutBy: string | null): Result<{ knockoutId: string; knocked_out_by: string | null }, "not_found" | "finished" | "not_busted" | "bad_knocker">`: the player must be out; the knockout is their newest by `busted_at` (the same pick as `latestKnockers` in `players-card.tsx`; share it rather than writing it twice); `knockedOutBy` is null or one of `knockerChoices`.
- Messages for each new refusal in `player-messages.ts`, in the same voice as the existing ones.

**Test scenarios:**
- Take away: 2 rebuys → 1; 0 → `no_rebuys`; finished → `finished`; works for a player who is out; unknown id → `not_found`.
- Choices: players still in; a player out after (place 3 when the player is 5th) included; a player out before (6th) excluded; never the player.
- Change knocker: newest of two knockouts (after a re-entry) chosen; null allowed; a player out before → `bad_knocker`; a player still in → `not_busted`.

**Steps:** tests, fail, implement, pass, `npm test`, `npm run lint`, commit `feat: rules for fixing a clock player's rebuys and knockout`.

### Task 3: Save clock settings

**Files:**
- Modify: `features/clock/lib/clocks.ts` (move `settingsOf` from `payouts-card.tsx` here as `clockSettingsOf(clock): ClockSettings`; add `type ClockDetails = Omit<ClockSettings, "places_paid" | "payout_pcts">`)
- Modify: `features/clock/components/control/payouts-card.tsx` (use `clockSettingsOf`)
- Modify: `features/clock/actions/clocks.ts`

**Responsibility:** `updateClockSettingsAction(clockId: string, details: ClockDetails): Promise<ClockActionResult & { clock?: TournamentClock; errors?: StructureError[] }>` (or a named result type like `PayoutsActionResult`): validate name, money, chips and max rebuys with the clock rules (the payout check isn't part of this save; make `validateSettings` separable if needed rather than passing dummy payouts); update those six columns (name trimmed) `.eq("id", clockId).neq("status", "finished")`; no row → "This clock is finished or no longer exists."; on success `revalidatePath(CLOCKS_PATH)` (the list shows names) and return the saved clock.

**Test scenarios:** the rules are covered by `validateSettings` tests; add a test for whatever split of `validateSettings` this needs (details checked without payouts).

**Steps:** test (if a split was made), implement, `npx tsc --noEmit`, `npm test`, `npm run lint`, commit `feat: save a clock's settings while it runs`.

### Task 4: Player fix actions

**Files:**
- Modify: `features/clock/actions/entrants.ts`

**Responsibility:**
- `takeAwayRebuyAction(clockId, entrantId): Promise<PlayersActionResult>` through `changePlayers`: plan with `planTakeAwayRebuy`; update `_clock_entrants` `rebuys` `.eq("id").eq("clock_id").eq("rebuys", current)`; no row → `CHANGED_ELSEWHERE`; return `savedPlayers`.
- `changeKnockerAction(clockId, entrantId, knockedOutBy: string | null): Promise<PlayersActionResult>` through `changePlayers`: plan with `planChangeKnocker`; update `_clock_knockouts.knocked_out_by` `.eq("id", knockoutId).eq("clock_id", clockId)` and conditional on the old value (`.is(null)` or `.eq`); no row → `CHANGED_ELSEWHERE` (the bust was undone or changed elsewhere); write errors through `writeFailure`.

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: take away a rebuy and change a knockout`.

### Task 5: Save edited levels

**Files:**
- Modify: `features/clock/actions/clocks.ts`

**Responsibility:** `updateClockLevelsAction(clockId: string, levels: BlindLevel[]): Promise<ClockControlResult>`: `loadClockAndTime`; `planLevelEdit(clock, levels, nowMs)`; refusals → "This clock is finished." / "Fix the levels." / `CHANGED_ELSEWHERE`; update `{ levels, ...timing }` conditional on `status`, `level_index`, and `level_started_at` (running) or `paused_remaining_ms` (paused); no row → `CHANGED_ELSEWHERE`; return the saved clock via `toClock`.

**Notes:** Re-check every sent row on the server (`planLevelEdit` does): never trust the page's list. Check in the click-through that the timestamptz equality on `level_started_at` matches the string the database returned; if it doesn't, compare on `level_index` and `status` only and note it here.

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: save a running clock's edited levels`.

### Task 6: Details card on the control screen

**Files:**
- Create: `features/clock/components/control/details-card.tsx`
- Modify: `features/clock/components/control/clock-controls.tsx` (render it above `PayoutsCard`)

**Responsibility:** A card titled "Details" showing buy-in and rebuy, starting and rebuy chips, max rebuys (use the existing money and chip formatters in `lib/format.ts` / `lib/money.ts`), and a levels summary line from `summarizeLevels` ("18 levels, 3 breaks · 5h 20m"). Until the clock is finished, an **Edit** button opens a drawer (same structure as `EditPayoutsDrawer`: form mounted only while open) with `SettingsFields` (`idPrefix="clock-details"`), state from `useReducer(settingsReducer<ClockSettings>, clock, clockSettingsOf)`, errors from the details check, and Save / Cancel. Save runs `updateClockSettingsAction` through `useActionWithToast`, applies the returned clock with `applyRow`, and closes.

**Check:** name change shows in the card header and on the display; buy-in change moves the pool and payouts.

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: edit a clock's settings from the control screen`.

### Task 7: Edit player drawer

**Files:**
- Create: `features/clock/components/players/edit-player-drawer.tsx`
- Modify: `features/clock/components/players/player-row.tsx` (optional `onEdit`: the name area becomes a button with an accessible label "Edit <name>"; no change when absent)
- Modify: `features/clock/components/players/players-card.tsx` (an `editingId` state like the bust dialog's; pass `onEdit` while the clock isn't finished)

**Responsibility:** A drawer titled with the player's name, reading the live player from `players` so it updates as saves land:
- **Rebuys:** "2 rebuys" and a **Take away a rebuy** button while `planTakeAwayRebuy` allows it; runs `takeAwayRebuyAction` through `usePlayerAction`; stays open.
- **Knocked out by** (only when the player is out): a `Select` like the bust dialog's, options from `knockerChoices` plus "Not recorded", starting at the current knocker; **Save** enabled when it differs; runs `changeKnockerAction`, then closes.
- A player still in with no rebuys shows "No rebuys" and nothing to change (no special empty state beyond that line).

**Steps:** implement, `npx tsc --noEmit`, `npm run lint`, commit `feat: fix a clock player's rebuys and knockout`.

### Task 8: Share the level editor with clocks

**Files:**
- Modify: `features/clock/lib/structure-editor.ts` (`type LevelsDraft = Pick<StructureDraft, "levels" | "new_level_seconds" | "new_break_seconds">`; `type LevelsAction` = the level actions plus the two new-row length fields; `levelsReducer<T extends LevelsDraft>(draft: T, action: LevelsAction): T`; `structureEditorReducer` delegates its level cases to it)
- Modify: `features/clock/components/structures/levels-fields.tsx` (props `draft: LevelsDraft`, `dispatch: Dispatch<LevelsAction>`, optional `locks?: LevelLocks` and `currentIndex?: number`)
- Modify: `features/clock/components/structures/level-row.tsx` (optional `isLocked` and `canDrag`, and a "Now playing" marker)
- Test: `features/clock/lib/structure-editor.test.ts` (existing tests pass unchanged; add `levelsReducer` on a bare `LevelsDraft`)

**Responsibility:** Without `locks` everything behaves exactly as today. With `locks`: rows before `firstEditable` are greyed, can't be opened, removed or dragged; the row at `currentIndex` shows "Now playing", opens and edits, but has no drag handle and no remove; drops onto an index below `firstMovable` are ignored; remove only from `firstMovable` on (and never the last row).

**Check:** the template editor still drags, adds, removes and edits as before (quick pass in the browser on an existing template, no save needed).

**Steps:** tests, implement, `npm test`, `npx tsc --noEmit`, `npm run lint`, commit `refactor: let the level editor lock rows`.

### Task 9: Edit levels page

**Files:**
- Modify: `features/clock/lib/paths.ts` (`clockLevelsPath(id)` → `/admin/clock/<id>/levels`)
- Modify: `features/clock/lib/level-edits.ts` + test (`clockLevelsDraft(clock, nextKey): LevelsDraft` with new-row lengths from `mostCommonSeconds`, and `levelsChanged(saved: BlindLevel[], draft: DraftLevel[]): boolean` ignoring keys)
- Create: `app/admin/clock/[id]/levels/page.tsx`
- Create: `features/clock/components/levels/clock-levels-editor.tsx`
- Modify: `features/clock/components/control/details-card.tsx` (an **Edit levels** link beside the summary while the clock isn't finished)

**Responsibility:**
- Page (server): `getClock` + `getServerNowMs`; error → `ErrorHandler`; missing → `notFound()`; finished → `redirect(clockControlPath(id))`; `PageHeader` / `DesktopPageHeader` titled "Levels".
- Editor (client): a back link to the control screen; a live line with the current level and time left (`useClock` + the display's `describeClock` text); `LevelsFields` with `locks = levelEditLocks(view.status, view.position.levelIndex)` and `currentIndex`; errors from `validateLevels` shown only on editable rows; the `beforeunload` warning while `levelsChanged` (reuse the template editor's warning; extract it to `features/clock/hooks/use-leave-warning.ts` if it's inline); **Save** in a `BottomTabAccessory` like the template editor, disabled while unchanged, invalid or pending. Save runs `updateClockLevelsAction` through `useActionWithToast` and, on success, goes to the control screen (decision 1). If the clock finishes while the page is open, show the existing finished state from `useClock` and disable Save.

**Test scenarios** (pure helpers): `clockLevelsDraft` keys every row and picks the common lengths; `levelsChanged` false for the same levels with new keys, true after an edit typed then changed.

**Steps:** tests, implement, `npm test`, `npx tsc --noEmit`, `npm run lint`, commit `feat: edit a running clock's levels`.

### Task 10: Click-through on dev

Dev server and the in-app Browser pane (signed in as the dev admin), control screen and `/clock/[id]` side by side. Make a test clock from NLPT Standard with four or five players.
1. Details: rename and change the buy-in → the card header, display name and pool follow; an invalid chip count shows its error and can't be saved.
2. Players: rebuy someone, then take it away from Edit player → count and pool drop on both screens. Bust two players with a knocker each; change the first one's knocker → KO badges move; pick "Not recorded" → badge drops. A player out earlier than the knocker isn't offered.
3. Levels, running: open Edit levels mid-level; lengthen the current level → time left grows on the display; shorten it below the time played → the next level starts with its full time; add a break two levels ahead and reorder an upcoming level → the display's next level and next break follow.
4. Levels, paused: shorten and lengthen the current level → paused time left follows.
5. Let a level run out with the page open → its row locks and "Now playing" moves down.
6. Press +1 min on the control screen while the levels page is open, then save → saved without losing the minute (the page saves from the server's current state); press pause in another tab between opening and saving → "The clock changed on another screen. Try again."
7. Finish the clock → Edit, Edit levels and the player name buttons disappear; opening `/levels` redirects.
8. Phone width (390 px): drawers and the levels page fit; then on the iPhone over the LAN.
9. Clean up: delete the test clock.

Record anything that differed in this plan's status line. No commit unless fixes were needed.

### Task 11: Docs

- This plan: status line and "Changes from this plan".
- Design doc (`2026-11-22-tournament-clock-live-edits-design.md`): built on dev; anything that changed.
- `2026-11-18-tournament-clock-design.md`: in Screens & routes add `/admin/clock/[id]/levels` and the Details card / Edit player drawer to the control screen row; link the live-edits design.
- Commit `docs: record clock live edits`.

## Refinement pass

One commit each where something changes; skip any that find nothing (no empty commits).

### Task R1: Lint and Format
**Skill:** lint-and-format. Prettier and `npm run lint -- --fix` on the changed files; `npm test` passes. Commit `chore: fix lint and format violations`.

### Task R2: Reduce Complexity
**Skill:** reduce-complexity. Watch `planLevelEdit`, `levels-fields.tsx` after the lock props, and the levels editor. Commit `refactor: simplify clock live edits`.

### Task R3: Improve Readability
**Skill:** improve-readability. Commit `refactor: clarify clock live edit names`.

### Task R4: Make It DRY
**Skill:** make-it-dry. Watch the three drawers (payouts, details, edit player) for a shared drawer shell, and the knocker select shared with `BustDialog`. Extract only what's repeated three times. Commit `refactor: share clock edit drawers`.

### Task R5: Standards Alignment
**Skill:** standards-alignment. Explicit return types on the new actions and helpers. Commit `refactor: align clock live edits with standards`.

## After this plan

- Merge `feat/clock-live-edits` into `staging` (no force) and check on Vercel and the phone.
- PR to `master`. No prod database step.
