# Tournament Clock Phase 7 (Finish Flow) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** When one player is left, the admin finishes the clock, reviews the results (prefilled from the clock), and saves them as a tournament with its members' sessions, replacing manual entry.

**Architecture:** Finishing is one database function (`finish_tournament_clock`) that stops the clock and places the last player 1st in one transaction; `reopen_tournament_clock` undoes it until results are saved. The review screen `/admin/clock/[id]/finish` is a server page that loads the clock, its players, the seasons and weeks, and prefills a form from `buildFinishResults` (phase 2) plus defaults for name, date and week. Saving calls `save_clock_results`, which inserts the `_tournaments` row and its `_tournament_sessions` (or, when the clock already saved results, updates that tournament and replaces its sessions) and links the clock, all in one transaction. The server action then refreshes rankings and caches the same way today's tournament entry does, through a helper shared with it.

**Tech Stack:** Next.js 16 (server components, server actions), React 19, Supabase (SQL functions, RLS), shadcn/ui (`Card`, `Input`, `Select`, `Calendar`/`Popover`, `AlertDialog`, `Table`), Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,actions,data,lib}`; server actions re-check `isAdmin()` (`features/clock/actions/is-admin.ts`) and return `{ success, message }`; migrations applied to **dev only**; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (Finish flow). Earlier phases: `...-phase-4-clock-core.md`, `...-phase-5-entrants.md`, `...-phase-6-tv-mode-sounds.md`. Branch: `feat/tournament-shot-clock`.

---

## Decisions made in this plan (confirm before starting)

1. **Finish appears on the control screen once one player is left** (running or paused), with a confirmation: "Finish the tournament? Alex S. wins." It stops the clock, saves where it was, and places the winner 1st. Before that it isn't shown; the clock can still be deleted.
2. **Reopen** puts a finished clock back to paused at the level it stopped on and un-places the winner, for a finish pressed by mistake. Only until results are saved.
3. **Review screen** (`/admin/clock/[id]/finish`), prefilled and editable:
   - **Name:** the clock's name. **Date:** the day the clock was created, in the league's time zone (a late game saved the next morning still gets the game's date). **Season and week:** the current season's latest week; the admin confirms. All required.
   - **Tournament numbers** from `buildFinishResults`: buy-in, rebuy, player count (guests included), total rebuys (guests included), places paid (places actually paid). Editable.
   - **Members:** one row each, in saved place order (re-ranked among members): place (read-only), name, rebuys and cash-out (editable). Guests are listed underneath, read-only, "not saved: guests have no stats".
4. **Saving** creates the tournament and its sessions in one transaction and links the clock to it. **Saving again** (from the same review screen) updates that tournament and replaces its sessions, so a mistake can be fixed from the clock. Once saved, the clock list and control screen show "Results saved" with a link to the tournament's page.
5. **After saving**, rankings and caches refresh exactly as manual entry does: the week's NLPI rankings are recalculated, the league cache tag is cleared, and the same pages revalidated. That code moves into a shared helper both use.
6. **No points or net profit are written**: `_tournament_session_points` works them out, as for manual entry.
7. **Prod:** the new migration joins the clock migrations waiting for phase 4's prod rollout (needs your go-ahead).

## Ground rules

- Dev only (`supabase-dev`) for the migration. The click-through saves a real tournament on dev; delete it (and recalc that week's rankings) afterwards.
- Pure logic in `features/clock/lib/`, tests next to it.
- Pull before each session.

## Facts (checked 2026-11-20)

- `buildFinishResults(clock, entrants)` (`features/clock/lib/results.ts`) returns `{ tournament: { places_paid, buy_in_amount, rebuy_amount, player_count, total_rebuys }, sessions: [{ member_id, rebuys, cash_out, place }] }`, or refuses `no_entrants` / `unplaced_entrants`. `planFinish(entrants)` (`entrants.ts`) and `finishClock(clock, nowMs)` (`timing.ts`) already exist.
- `_tournaments`: `id`, `week_id` (fk `_weeks`), `date` (date), `name`, `places_paid` (≥ 1, nullable), `buy_in_amount`, `rebuy_amount` (≥ 0), `player_count`, `total_rebuys` (≥ 0). `_tournament_sessions`: `member_id`, `tournament_id` (cascade), `cash_out` (≥ 0), `rebuys` (≥ 0), `place` (≥ 1); unique `(member_id, tournament_id)`.
- `_tournament_clocks.tournament_id` exists (fk `_tournaments`, on delete set null) and is null for every clock today.
- Manual entry: `app/admin/stats/tournaments/new` inserts `_tournaments` from the browser, then `addTournamentSessionAction` (`features/admin/actions/add-session.tsx`) inserts sessions, calls `insert_weekly_nlpi_rankings(target_week_id)` per week, `updateTag(LEAGUE_DATA_TAG)`, and revalidates `/nlpi`, `/poy/[year]`, `/members/[id]`, `/tournaments` (layout).
- Seasons and weeks: `getSeasons()` and `getWeeks(seasonId | null)` in `lib/data/league.ts`; `Week = { id, week_number, season_id }`. The new-tournament form defaults to a season's latest week.
- Clock entrants: `busted_at` and `finish_place` are set together (a check), so the winner gets `busted_at` = the finish time.
- Tournament pages: `/tournaments/[year]/[id]`.
- `formatClockDate` (`format.ts`) formats dates in `America/Chicago`.

---

### Task 1: Migration — finish, reopen, save results

**Files:**
- Create: `supabase/migrations/<ts>_tournament_clock_finish.sql`

**Functions** (all `language plpgsql`, `security invoker`, `set search_path = ''`, executable by `authenticated` only):
- `finish_tournament_clock(p_clock_id uuid, p_winner_id uuid, p_finished_at timestamptz, p_level_index int, p_remaining_ms int) returns _tournament_clocks`: in one transaction, places the winner (`finish_place = 1`, `busted_at = p_finished_at`, only if they're the clock's one player still in) and sets the clock `finished` with the level and time left, only if it's running or paused. Raises `no_data_found` if either update matches nothing (another screen finished it, or the players changed).
- `reopen_tournament_clock(p_clock_id uuid) returns _tournament_clocks`: only while finished and `tournament_id` is null: clears the winner's place and sets the clock `paused` with the saved time left. `no_data_found` otherwise.
- `save_clock_results(p_clock_id uuid, p_tournament jsonb, p_sessions jsonb) returns uuid`: the clock must be finished. If the clock has no `tournament_id`, inserts `_tournaments`; otherwise updates it and deletes its sessions. Inserts `p_sessions` (each `{ member_id, rebuys, cash_out, place }`), sets the clock's `tournament_id`, returns the tournament id. Every table check applies, so bad input rolls the whole thing back.

**Verify on dev** (in rolled-back blocks, as admin; as anon and a non-admin: refused):
- Finish with one player left → clock finished, winner placed 1st; again → `no_data_found`; with two players left → `no_data_found` and nothing changed.
- Reopen → paused with the same time left, winner un-placed; after results are saved → refused.
- Save → tournament and sessions created, clock linked; save again with different cash-outs → same tournament updated, sessions replaced (no duplicates); a session with a negative cash-out → error, nothing saved.

**Commit:** `feat: finish tournament clocks and save their results in the database`

### Task 2: Finish and reopen (pure)

**Files:**
- Create: `features/clock/lib/finish.ts`, `features/clock/lib/finish.test.ts`

**Contract:**
- `planFinishClock(clock, entrants, nowMs): Result<{ winnerId; finishedAt; levelIndex; remainingMs }, "wrong_status" | "players_remaining" | "no_players">`: `planFinish` plus `finishClock`'s timing.
- `canReopen(clock): boolean`: finished and no `tournament_id`.
- `finishRefusalMessage(reason): string`.

**Tests:** one player left while running → the winner and the caught-up level and time; while paused → the paused time; two left → `players_remaining`; nobody → `no_players`; setup or finished → `wrong_status`; `canReopen` before and after results are linked.

**Commit:** `feat: plan finishing a tournament clock`

### Task 3: Finish and reopen on the control screen

**Files:**
- Modify: `features/clock/actions/clocks.ts` (`finishClockAction(id)`, `reopenClockAction(id)`)
- Modify: `features/clock/components/control/clock-controls.tsx` (and a new `finish-panel.tsx` if it keeps the file small)

- `finishClockAction`: admin check → clock, players and database time → `planFinishClock` → `finish_tournament_clock` → the saved clock. Revalidates the clock list.
- Control screen: when `planFinishClock` would succeed, a **Finish** button (with the confirmation from decision 1). When finished: a card "Finished. Alex S. wins." with **Review results** (to `/admin/clock/[id]/finish`) and **Reopen** (while `canReopen`), or, once saved, "Results saved" and **View tournament**.

**Commit:** `feat: finish and reopen a clock from the control screen`

### Task 4: Review form defaults and checks (pure)

**Files:**
- Create: `features/clock/lib/finish-form.ts`, `features/clock/lib/finish-form.test.ts`

**Contract:**
- `type FinishForm = { name; date /* yyyy-mm-dd */; season_id; week_id; tournament: FinishTournament; sessions: (FinishSession & { name: string })[] }`.
- `finishFormDefaults({ clock, entrants, members, seasons, weeks }): Result<FinishForm, FinishResultsRefusal>`: `buildFinishResults`, names from `entrantNames`, the date from `clock.created_at` in `America/Chicago`, the current season (the newest) and its latest week. Cash-outs rounded to the cent.
- `validateFinishForm(form): FinishFormError[]`: name required; date valid; week chosen; numbers whole and ≥ 0 (money ≥ 0 with cents allowed); places paid ≥ 1; each session's rebuys whole ≥ 0 and cash-out ≥ 0; at least one session.
- `finishFormToSave(form)`: the `p_tournament` / `p_sessions` payloads.

**Tests:** the design's example field (11 players with guests) → members re-ranked with their true-place payouts; a guest winner → the 2nd-place member saved 1st with the 2nd-place payout; date from a late-night `created_at` (01:30 UTC on Nov 28 → Nov 27); the latest week of the newest season chosen; each validation message.

**Commit:** `feat: prefill and check the clock results form`

### Task 5: Share the post-save refresh with manual entry

**Files:**
- Create: `lib/data/refresh-after-tournament-save.ts` (server-only helper)
- Modify: `features/admin/actions/add-session.tsx` (use it; no behaviour change)

`refreshAfterTournamentSave(db, weekIds)`: recalculates each week's NLPI rankings (logging, not failing, on errors), `updateTag(LEAGUE_DATA_TAG)`, and revalidates `/nlpi`, `/poy/[year]`, `/members/[id]`, `/tournaments` (layout).

**Commit:** `refactor: share the refresh after saving a tournament`

### Task 6: Save results action

**Files:**
- Create: `features/clock/actions/results.ts`

`saveClockResultsAction(clockId, form)`: admin check → `validateFinishForm` (errors back to the form) → `save_clock_results` → `refreshAfterTournamentSave(db, [week_id])` (and the previous week too, when re-saving moved the tournament to another week) → revalidate the clock list and control screen → `{ success, message, tournamentId }`.

**Commit:** `feat: save a finished clock's results as a tournament`

### Task 7: Review screen

**Files:**
- Create: `app/admin/clock/[id]/finish/page.tsx`
- Create: `features/clock/components/finish/finish-review.tsx` (client form), `tournament-fields.tsx`, `session-rows.tsx`

- The page loads the clock (not finished → redirect to the control screen), players, member names, seasons and weeks, and passes `finishFormDefaults` (or the refusal message) to the form. When the clock already saved results, it prefills from the saved tournament and sessions instead, so re-saving edits them.
- The form: name, date (calendar popover, as manual entry), season and week selects (changing the season picks its latest week), the tournament numbers, a members table (place, name, rebuys, cash-out), guests underneath. Errors by the field. **Save results** (or **Save changes**) calls the action; on success, a toast and links to the tournament and back to the clock.

**Commit:** `feat: review and save a finished clock's results`

### Task 8: Results status in the clock list

**Files:**
- Modify: `features/clock/components/clocks/clock-card.tsx`, `features/clock/data/clocks.ts` (summary includes `tournament_id`)

Finished clocks show "Results saved" with a link to the tournament, or "Results not saved" with a link to the review screen.

**Commit:** `feat: show whether a clock's results are saved`

### Task 9: Click-through on dev

Browser 1 (confirm first). A test clock with 4 members and 2 guests:
- Bust down to one player; Finish appears; finish → the clock shows finished, the winner 1st; Reopen → paused, same time; finish again.
- Review: defaults right (name, date, latest week, numbers, members re-ranked with true-place cash-outs, guests listed); clear the name → error; save → toast; the tournament page and POY / NLPI show the results.
- Re-save with a changed cash-out → the same tournament updated, no duplicate sessions; Reopen is gone.
- Afterwards: delete the test tournament and clock on dev and recalc that week's rankings.

### Task 10: Docs

Design doc (Finish flow as built, the three functions, re-saving), this plan's status, and the phase 4 rollout list (this migration added).

**Commit:** `docs: record clock phase 7 decisions`

---

## Refinement pass

R1 lint and format · R2 reduce complexity (watch `finish-review.tsx`, the save action) · R3 readability · R4 DRY (the form fields shared with the template editor and manual tournament entry) · R5 standards. One commit each where something changes; skip the rest.
