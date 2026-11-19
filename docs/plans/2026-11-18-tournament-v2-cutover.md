# Tournament v2 Cutover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Move the app's tournament data from `tournaments` / `tournament_sessions` to the v2 tables (`_tournaments`, `_tournament_sessions`, `_tournament_session_points`) with identical stats output, on dev first and then prod.

**Architecture:** SQL migrations live in `supabase/migrations/` and are applied with the Supabase MCP (`apply_migration`). `_tournament_sessions` stores only the source data (`rebuys`, `cash_out`, `place`). The `_tournament_session_points` view calculates buy-in, net profit and points from the tournament's prices and `_tournament_place_points`. The seven SQL function signatures the app calls are rewritten to read v2; dead functions are dropped. A read-only snapshot query (row count + hash per function call) proves output is unchanged before and after. Cash stays on v1.

**Tech Stack:** Supabase Postgres (RLS, `security_invoker` views, SQL/plpgsql functions), Next.js 16 / React 19 / TypeScript, `@supabase/ssr`.

**Standards:** Scheels tech-standards-devs used as general guidance only (strict TS, explicit types, single responsibility, early returns). This repo is Next.js + Supabase, not .NET/Vite. Follow existing repo conventions: `features/<area>/{components,actions}`, `lib/data/league.ts` cached loaders, server actions returning `{ success, message }`.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` → "Phase 0".

---

## Ground rules

- **Databases.** Dev = `vykeezhlyltsiuyqkode` (MCP server `supabase-dev`, read/write). Prod = `mttdnkrtyknlmbnwdoye` (MCP server `supabase`, `read_only=true`). Never write to prod until Task 10, and only after the user explicitly approves it there.
- **One migration = one file** in `supabase/migrations/<timestamp>_<name>.sql`. Commit the file, then apply exactly that file's contents to dev with `mcp__supabase-dev__apply_migration` using the same name. Prod gets the same files later.
- **Migrations must not depend on dev-only or prod-only objects.** The databases' migration histories differ (dev has `trinkets`, `member_admin_and_accounts`, …; prod has `fix_member_rebuy_stats`, …). Only touch the tournament objects listed here, plus `week`, `season`, `members`.
- **No test runner exists.** Verification is: the snapshot diff, `npx tsc --noEmit`, `npx eslint <changed files>`, `npx prettier --check <changed files>`, `npm run build`, and a manual click-through.
- **Commits.** Conventional prefix (`feat:`, `fix:`, `chore:`, `docs:`), no ticket, no `Co-Authored-By` or other AI attribution.

## Facts the executor needs (verified 2026-11-18 on both databases)

- Tournament data is identical on dev and prod: 13 tournaments, 195 v1 sessions, 87 of them `place = 0` filler rows. `_tournaments` has 13 rows and `_tournament_sessions` has 108 rows (the real sessions only).
- `_weeks` and v1 `week` share all 237 ids. `_seasons` and v1 `season` share ids. `_tournaments.week_id` resolves to the same season as v1 `tournaments.season_id` for every row. So v2 tournament queries may join v1 `week` / `season`.
- `_tournament_session_points` (`security_invoker=on`) columns: `id, member_id, tournament_id, buy_in, cash_out, net_profit, rebuys, place, week_id, date, tournament_name, poy_points, nlpi_points`. It currently caps points at `LEAST(place, 14)`.
- Every function and view is `SECURITY INVOKER`. v2 tables only have `SELECT` policies for `authenticated`. v1 tables allow `public` read. **Anonymous public pages will fail on v2 unless Task 3 adds anon read policies.**
- Write policies use `is_league_admin()` (checks `profiles.role = 'admin'`), the same as v1.
- The app calls these RPCs: `get_career_data(target_member_id, current_season_id)`, `get_career_stats(target_view, target_season)` (view ∈ `cash|tournament|cumulative`, season = season id or `"career"`), `get_major_data(target_tournament_id)`, `get_nlpi_info(current_season_id, target_filter_date)` (NLPI page, **2-arg overload**), `get_nlpi_info(current_season_id, target_filter_date, target_member_id)` (member page, 3-arg overload), `get_poy_info(current_season_id, target_member_id)`, `get_poy_records()`, `get_member_debut_date`, `get_member_advanced_skills`, `get_nlpi_rank_records`, `get_stat_avgs`, `get_recent_cash_session_info`, `insert_weekly_nlpi_rankings`. Of these, **only the first seven signatures read tournament tables** (directly or via functions they call; confirm transitive calls in Task 4).
- `features/admin/actions/add-session.tsx` `addTournamentSessionAction` selects `tournaments.week_id`, which does not exist in v1, so ranking recalculation after tournament saves has silently never run. Moving to `_tournaments.week_id` fixes this.

---

### Task 1: Snapshot query + "before" baselines ✅ done 2026-11-18

**Result:** 282 calls on each database. Baselines are in `docs/plans/verification/dev-before.txt` (overall md5 `a5cac593…`) and `prod-before.txt` (`a73c872f…`), stored as compact lines rather than JSON. The tournament-only outputs match between dev and prod: `get_major_data` 13/13 and `get_career_stats` tournament 6/6. Every difference is in cash-influenced output (cash/cumulative stats, NLPI, career data for 4 members, POY for season `61e348ff`, POY records), which matches dev's extra cash sessions. **For Tasks 3–5, compare the overall md5 first; diff line by line only if it changes.**

**Files:**
- Create: `supabase/migrations/.gitkeep`
- Create: `scripts/db/snapshot-tournament-functions.sql`
- Create: `docs/plans/verification/dev-before.txt`, `docs/plans/verification/prod-before.txt`

**Responsibility:** A single **read-only** SQL query that calls each of the seven tournament-reading function signatures across its full argument domain and returns one row per call: `fn`, `args` (jsonb), `row_count`, `hash`.

**Key logic:**
- Argument domains: every season id × every member id for member-scoped functions; `get_career_stats` for each view in `cash|tournament|cumulative` × (each season id + `'career'`); `get_major_data` for every tournament id; `get_nlpi_info` with `target_filter_date = null` and `target_member_id` = null and each member; `get_poy_info` with member null and each member; `get_poy_records()` once.
- Hash must be order-independent: `md5(string_agg(r::text, '|' order by r::text))` over the result rows.
- Use only `SELECT` (lateral calls are fine). No temp tables, so it runs on read-only prod.
- Source ids from v1 `season`, `members`, `tournaments` so the same query runs before and after.

**Steps:**
1. Write the query. Run it on dev and prod via `execute_sql`; save results as JSON to the two files.
2. Sanity check: the two baselines should match for every row except calls touching data that differs between the databases (dev has 16 extra cash sessions, so cash-influenced rows may differ). Note any differences in the commit body.
3. Commit: `chore: add tournament function snapshot query and baselines`

### Task 2: Data-fix checkpoint (user approval required)

**Files:** none (investigation only). Put findings in the PR description later.

**Responsibility:** Decide the correct values for the bad rows before any migration bakes them in. **Present the evidence to the user and stop until they choose.**

**Rows and current hypotheses** (check each against `sum(cash_out)` per tournament vs `money_in_play` and member/guest counts):
- `2025 Kindred Open`, place 6 (`c2484c8c…`): `buy_in 40`, `rebuys 1`. Hypothesis: buy_in should be 80 (tournament totals of 12 players / 8 rebuys / $800 only reconcile that way, plus one $40 guest).
- `Thanksgiving Showdown 2025`, place 9 (`a148d2c3…`): `buy_in 120`, `rebuys 0`. Hypothesis: rebuys should be 2 (members' rebuys then total 9, matching the tournament's 9).
- Session `db4e53cc…`, place 2: `buy_in 40, cash_out 154, net_profit 143`. Either cash_out is 183 or net_profit is 114. Check whether payouts sum to the pool.
- Tournament rebuy totals: `Lake Lizzie Luau 2022` (tournament 3 / $400 vs members 4 / $440) and `Lake Lizzie Luau 2024` (tournament rebuys 1 vs members 4, money matches at $440). Decide which side is right; the v2 `total_rebuys` gets the decided value.
- **Do not** change any `place` values. History stays as-is, including Thanksgiving Showdown 2024 skipping 4th.

**Output:** A short table of row → old value → new value, approved by the user. Task 3 encodes exactly this.

**✅ Decisions (approved 2026-11-19).** All of these are confirmed by payouts equalling the pool. Places and points are unchanged everywhere.

| Tournament | Row | Old | New | Encoded in |
|---|---|---|---|---|
| 2025 Kindred Open | 6th (`c2484c8c`) | buy-in $40, 1 rebuy | buy-in $80 (calculated from the rebuy) | view, no stored change |
| Thanksgiving Showdown 2025 | 9th (`a148d2c3`) | 0 rebuys ($120 in) | 2 rebuys | `…_tournament_v2_schema.sql` |
| Lake Lizzie Luau 2023 | 1st (`9b0501ce`) | cash-out $240 (payouts $460 > $440 pool) | $220 | `…_tournament_v2_schema.sql` |
| Lake Lizzie Luau 2023 | 2nd (`db4e53cc`) | net profit $143 (typo) | $114 (calculated) | view, no stored change |
| Lake Lizzie Luau 2022 | tournament | 3 rebuys, $400 | 4 rebuys, $440 | `…_tournament_v2_schema.sql` |
| Lake Lizzie Luau 2024 | tournament | 1 rebuy | 4 rebuys | `…_tournament_v2_schema.sql` |
| The Horace Hoedown | tournament | 7 rebuys ($720 implied) | 5 rebuys ($640 = payouts) | `…_tournament_v2_fix_guest_rebuys.sql` |
| Thanksgiving Showdown (2024) | tournament | 4 rebuys (guest's rebuy missing) | 5 rebuys ($560; payouts 45/30/15/10%) | `…_tournament_v2_fix_guest_rebuys.sql` |
| Northern Lights Open 2022 / Winter Invitational 2022 | 1st–4th | per-place payouts entered into each other (paid $520 / $440 against pools of $440 / $520) | swapped by place: NLO 208/112/80/40, WI 270/140/90/20 | `…_tournament_v2_swap_2022_payouts.sql` |

### Task 3: Migration — v2 schema, data, points, access ✅ applied to dev 2026-11-19

**Result:** Three migration files, applied to dev in order: `20261119132635_tournament_v2_schema`, `20261119133035_tournament_v2_fix_guest_rebuys` and `20261119133150_tournament_v2_swap_2022_payouts`. Differences from the contract below:
- The view casts the calculated `buy_in` / `net_profit` to `numeric(10,2)`, because the view's existing column types require it.
- `net_profit` was a generated column in the v2 table, so it is dropped before `buy_in`.
- Anon read was added only on `_tournaments`, `_tournament_sessions` and `_tournament_place_points`. `_tournament_summaries` joins v1 `week` / `season`, which are already public, so `_weeks` / `_seasons` don't need it.
- `unique(member_id, tournament_id)`, `place >= 1` and `tournament_id not null` already existed.

Verified: the view has 108 rows. Session buy-in, net profit, rebuys, cash-out and points match v1 except the approved rows. Every tournament's prize pool equals its payouts, except Thanksgiving Showdown 2024, where a guest took the remaining $56. Signed out (anon), reads return 13 summaries and 108 sessions, all with points.

**Files:**
- Create: `supabase/migrations/<ts>_tournament_v2_schema.sql`

**Contract (all in one transaction):**
1. **Re-sync check:** assert that `_tournament_sessions` matches v1 real sessions (`place > 0`) on `id, member_id, tournament_id, rebuys, cash_out, place`. `RAISE EXCEPTION` if any differ, so the migration aborts rather than silently diverging.
2. **`_tournaments` columns:** add `buy_in_amount numeric not null default 40`, `rebuy_amount numeric not null default 40`, `player_count int`, `total_rebuys int`. Backfill `player_count` from v1 `tournaments.player_count`, and `total_rebuys` from v1 `tournaments.rebuys` with the Task 2 corrections applied. Then set both `not null`, with `check (player_count >= 0)` and `check (total_rebuys >= 0)`. Backfill `places_paid` from v1 `places_payed` where it's null.
3. **Data fixes:** apply the Task 2 decisions to `_tournament_sessions.rebuys` / `cash_out`.
4. **Points:** upsert places 15 (POY 15, NLPI 1) and 16 (POY 10, NLPI 1) into `_tournament_place_points`.
5. **View:** recreate `_tournament_session_points` (keep `security_invoker=on`, same column names and order) so that `buy_in = t.buy_in_amount * (1 + ts.rebuys)`, `net_profit = ts.cash_out - that`, and points join on `LEAST(ts.place, 16)`.
6. **Drop** `_tournament_sessions.buy_in` and `.net_profit` after the view no longer references them.
7. **Constraints on `_tournament_sessions`:** `place not null`, `check (place >= 1)`, `tournament_id not null`, `unique (tournament_id, member_id)`. FK `tournament_id → _tournaments(id) on delete cascade` if not already present.
8. **Summary view:** create `_tournament_summaries` (`security_invoker=on`) with columns `id, name, date, week_id, season_id, season_year, places_paid, buy_in_amount, rebuy_amount, player_count, total_rebuys, prize_pool`, where `prize_pool = player_count*buy_in_amount + total_rebuys*rebuy_amount`. Join v1 `week` and `season` for the season id and year.
9. **Anon read:** add `SELECT` policies `to anon` (`using (true)`) on `_tournaments`, `_tournament_sessions`, `_tournament_place_points`, `_weeks`, `_seasons`, matching v1's public-read behavior. Leave write policies unchanged.

**Verify on dev after applying:**
- `select count(*) from _tournament_session_points` = 108.
- For every row not changed in Task 2, the view's `buy_in` / `net_profit` equal the v1 row's values.
- `prize_pool` equals v1 `money_in_play` for every tournament, except where Task 2 decided v1 was wrong.
- `set role anon; select count(*) from _tournament_summaries;` returns 13. Reset the role afterward.

**Commit:** `feat: tournament v2 schema, derived session money, public read`

### Task 4: Migration — repoint the seven live function signatures ✅ applied to dev 2026-11-19

**Result (approach changed from the contract below):** The seven functions aren't hand-rewritten. Two `security_invoker` views reproduce v1's table shapes (names and `real` types) from v2 data, and `20261119133508_tournament_functions_read_v2` rewrites each live definition in place by swapping the table names. The swap aborts unless every function has exactly the expected number of references. This keeps the change identical on dev and prod and keeps the output stable.
- **`_legacy_tournament_sessions`**: real sessions plus a 0 row (place 0) for each member who had joined by the tournament date (`members.join_date`) and didn't play. This replaces the stored filler rows and keeps the existing rule that a skipped tournament counts as 0 in NLPI's last-4 window, which is the same rule as v2's `nlpi_standings`. The filler guards inside the functions were left alone.
- **`_legacy_tournaments`**: v1's tournament columns mapped from `_tournament_summaries`.
- `20261119133556_get_major_data_group_by`: `get_major_data` grouped by `t.id` only, which relied on the table's primary key. It now lists the selected columns explicitly.

**Verification:** `dev-after-functions.txt` (md5 `46f88e2d…`) against `dev-before.txt`. **All 85 NLPI calls are identical.** Each of the 75 changed calls has an identified cause:
1. **Approved data fixes:** `get_major_data` changes for exactly the 9 fixed tournaments. `get_career_data` changes for exactly the 8 members in fixed rows. Career stats (tournament and cumulative) change for 2022, 2023, 2025 and career. POY records career net and gross profit match the fixes to the dollar. For example, `12d9a4dd`'s gross profit rises $18 because Winter 2022 2nd ($140 − $120 − 2) is now a winning session.
2. **No filler rows before a member joined (accepted 2026-11-19):** v1 had 29 backfilled filler rows for members who joined after the tournament. `get_poy_info` `majors_played`, `sessions_played` and averages drop for 5 late joiners in seasons before they joined. No rank or total-points changes.
3. **Float noise:** cumulative 2024 and 2026 differ only around 1e-5, because `real` sums run in a different row order.
4. **Tie order:** POY records `tournament_wins` (career and season) use `ORDER BY value DESC` (with `LIMIT 5` for season), which breaks ties arbitrarily. Members tied on 1 win can appear in a different order or selection.

**Follow-ups (out of scope, existing behavior):** `get_poy_records` `career_gross` subtracts `rebuys` (a count) as dollars on top of `buy_in`, which already includes rebuys. The tied record lists need a deterministic tiebreaker. Long term, rewrite the functions to read v2 directly and drop the `_legacy_*` views.

**Files:**
- Create: `supabase/migrations/<ts>_tournament_functions_v2.sql`

**Responsibility:** `CREATE OR REPLACE` the seven function signatures so they read `_tournament_session_points` / `_tournament_summaries` (or `_tournaments` joined to v1 `week` / `season`) instead of `tournaments` / `tournament_sessions`. **Signatures and return types stay identical**, so the app needs no change for reads that go through RPCs.

**Key logic:**
- First list the functions each of the seven calls (`pg_get_functiondef`, search for `public.` function names). Repoint any transitive callee that reads tournament tables too.
- Remove the filler-row guards (`buy_in > 0`, `place > 0`) for tournament sessions; they're redundant now. Keep cash-session guards as they are.
- `tournaments.season_id` becomes `week.season_id` via `_tournaments.week_id`. Use `_tournament_summaries.season_id`.
- `money_in_play`, `buy_ins`, `rebuys`, `player_count`, `places_payed` are read from `_tournament_summaries`. Keep the output column names unchanged (e.g. still return `places_payed` and `money_in_play` if the function returns them), so the app's types don't change in this task.

**Verify:** run `scripts/db/snapshot-tournament-functions.sql` on dev and save it as `docs/plans/verification/dev-after-functions.txt`. Diff it against `dev-before.txt`. **Expected:** identical, except calls whose results include the Task 2 rows. Explain every differing call in the commit body. Any unexplained diff blocks the task.

**Commit:** `feat: read tournament stats from v2 tables`

### Task 5: Migration — drop dead functions ✅ applied to dev 2026-11-19

**Result:** `20261119134211_drop_dead_tournament_functions` drops 18 functions: 15 unused standalone functions and the 1-argument overloads of `get_career_data`, `get_career_stats` and `get_poy_info`. The app's call list was rechecked (including multi-line calls and every quote style) and is still the same 12 RPCs. No function, view, trigger or policy referenced any of the dropped ones. `get_career_stats()` with no arguments was on the candidate list but only reads cash tables, so it was kept. A guard at the end of the migration fails if any `public` function still reads v1 `tournaments` / `tournament_sessions`, and it passed. The snapshot overall md5 is unchanged at `46f88e2d…`. The app's other read RPCs (`get_member_advanced_skills`, `get_member_debut_date`, `get_nlpi_rank_records`, `get_recent_cash_session_info`, `get_stat_avgs`) run, and `insert_weekly_nlpi_rankings` exists. Dev now has 39 public functions, down from 57.

**Files:**
- Create: `supabase/migrations/<ts>_drop_dead_tournament_functions.sql`

**Responsibility:** Drop every `public` function that references `tournaments` or `tournament_sessions` after Task 4 and isn't reachable from the app's RPC list (directly or transitively). Expected candidates include `get_nlpi_info_new`, `get_nlpi_info_updated`, the 1-arg `get_poy_info` (keep **both** `get_nlpi_info` overloads, since the app calls both), the 1-arg `get_career_data`, `get_career_stats()` / `(text)`, `get_general_stats` (both), `get_major_stats`, `get_season_major_stats`, `get_majors_data`, `get_member_nlpi_data`, `get_nlpi_data` (both), `get_poy_data`, `get_player_comparison`, `get_best_nlpi_rank`, `get_recent_tournament_sessions`, `get_tournament_sessions_by_season`.

**Steps:**
1. Re-grep the app for `rpc(` (including multiline calls) to confirm the call list. Drop only functions not on it and not called by anything on it.
2. Use exact signatures in `DROP FUNCTION`.
3. **Verify:** `select proname from pg_proc … where pg_get_functiondef(oid) ~ '\m(tournaments|tournament_sessions)\M'` returns zero rows (filter `prokind = 'f'`). Re-run the snapshot; it must still match `dev-after-functions.txt`.

**Commit:** `chore: drop unused tournament SQL functions`

### Task 6: App reads → v2 ✅ 2026-11-19 (`6a41939`)

**Result:** `utils/tournament/queries.ts` `selectTournamentsWithSessions(db, seasonId)` runs two queries (summaries, then session points) and groups them in code. It's used by `getTournaments` (public cache) and both admin list pages. The `Tournament`, `TournamentSession` and `MajorsData` types (`sessions`, `season_year`, `prize_pool`, `total_rebuys`) now describe the v2 views. Removed the duplicate public tournament card. The tournament detail pages read through `get_major_data`, whose output names didn't change, so they weren't touched. `/admin/tournaments` is orphaned (nothing links to it) and its query was already broken; it now uses the helper. Remove the page or keep it as a follow-up.

**Files (modify):**
- `utils/types.ts`: `Tournament` becomes the `_tournament_summaries` shape (`week_id`, `season_id`, `season_year`, `places_paid`, `buy_in_amount`, `rebuy_amount`, `player_count`, `total_rebuys`, `prize_pool`). `TournamentSession` becomes the `_tournament_session_points` shape (adds `week_id`, `date`, `tournament_name`; `buy_in` / `net_profit` stay present but are derived).
- `lib/data/league.ts` (`from("tournaments")` around line 211)
- `app/(home)/tournaments/_lib/utils/fetch-data.tsx`, `app/(home)/tournaments/[year]/[id]/fetch-data.tsx`, `app/(home)/tournaments/**` components that read `money_in_play` / `buy_ins` / `places_payed`
- `features/tournaments/components/tournament-card.tsx`, `tournament-info-card.tsx`, `tournament-sessions.tsx`, `tournament-sessions-list.tsx`
- `app/(home)/tournaments/[year]/[id]/_components/tournament-sessions.tsx`: remove the `.filter((s) => s.place > 0)`
- `app/admin/tournaments/page.tsx`, `app/admin/stats/tournaments/page.tsx`: these use embedded selects like `tournaments, tournament_sessions(*), season(year)`. Replace them with `_tournament_summaries` plus a separate `_tournament_session_points` query (filtered by `tournament_id`), then group in code. Don't rely on PostgREST embedding through views.
- Any other file from `grep -rlnE '"tournaments"|"tournament_sessions"|places_payed|money_in_play|buy_ins'` that reads (not writes).

**Key logic:** "Total buy-ins" on cards = `player_count + total_rebuys`, and "money in play" = `prize_pool`. Keep the UI labels as they are.

**Verify:** `npx tsc --noEmit` is clean. `grep -rnE '"tournaments"|"tournament_sessions"|places_payed|money_in_play'` on app code only matches write paths (handled in Task 7) or SQL output field names returned by RPCs.

**Commit:** `feat: read tournaments from v2 tables in app`

### Task 7: Admin writes → v2 ✅ 2026-11-19 (`c0dc3ab`)

**Result:** The new tournament form has a week select (defaults to the season's latest week) plus buy-in and rebuy prices (default $40), guest-inclusive player and rebuy totals, places paid, and a calculated prize pool. It sends the date as `yyyy-MM-dd` and shows errors on the page. The session form drops the buy-in input (buy-in and net profit are calculated for display), saves only members who played, requires place ≥ 1, and keeps drafts in the browser per tournament (`tournamentSessionsToAdd:<id>`). `addTournamentSessionAction` checks for an admin, inserts into `_tournament_sessions`, maps `23505` to a clear message, and recalculates NLPI rankings for the tournament's week. That recalculation never actually ran before, because v1 tournaments had no `week_id`. `utils/tournament/utils.ts` (in-code points tables and filler helpers) is deleted. `features/tournaments/components/tournament-sessions-list.tsx` is unused, already dead code.

**Verified:** `npx tsc --noEmit` clean (the only errors are stale `.next/types`). ESLint clean apart from one warning that was already there. Prettier applied. `npm run build` passes against **dev** (shell env from the scratchpad, `.env.local` untouched), with all tournament pages pre-rendered from v2. The local build needs `SUPABASE_SERVICE_ROLE_KEY` for `/admin/tournaments` (`createStaticClient`); that was true before this change, and a placeholder was used for the check.

**Files (modify):**
- `app/admin/stats/tournaments/new/_components/newTournamentForm.tsx`: insert into `_tournaments`: `name`, `date`, `week_id` (replaces the season picker; add a week select filtered by season, sourced from v1 `week`, whose ids match `_weeks`), `places_paid`, `buy_in_amount` (default 40), `rebuy_amount` (default 40), `player_count`, `total_rebuys`. Drop the `money_in_play` input; show the calculated prize pool read-only.
- `app/admin/stats/tournaments/new/page.tsx`, `app/admin/stats/tournaments/[id]/sessions/add/page.tsx`: load the weeks and the `_tournaments` row.
- `features/tournaments/components/tournament-sessions-form.tsx`: send only members who played, with `member_id`, `tournament_id`, `rebuys`, `cash_out`, `place`. No buy-in, net profit or points fields; show the calculated buy-in and net profit for display only, using the tournament's prices.
- `features/admin/actions/add-session.tsx` `addTournamentSessionAction`: insert into `_tournament_sessions`, read `week_id` from `_tournaments` (so recalculation actually runs now), and keep `updateTag(LEAGUE_DATA_TAG)` / `revalidatePath`. Also revalidate the tournament pages.
- `utils/tournament/utils.ts`: delete `TournamentNLPIPointsMap`, `TournamentPOYPointsMap`, `assignTournamentSessionPoints`, `assignTournamentNLPIPointsToSessions`, `assignTournamentPOYPointsToSessions`, `fillInMissingTournamentSessions`, and the `SessionNoId` / `SessionNoPointsOrId` types. Replace them with a single `TournamentSessionInput` type.
- `features/admin/actions/edit-session.tsx` and any tournament edit path found by grep: same treatment.

**Key logic / guards:**
- Server actions re-check admin with `getCurrentUser()` before writing (RLS also enforces it).
- Map a unique-violation error (`23505`) on `(tournament_id, member_id)` to a friendly message.

**Verify:** `npx tsc --noEmit`. On dev, create a throwaway tournament through the UI with 3 members (and `player_count` 4 for a guest), confirm the view rows and points, then delete it.

**Commit:** `feat: write tournaments and sessions to v2 tables`

### Task 8: Local click-through on dev (user checkpoint) ⏳ set up 2026-11-19

`.env.development.local` (gitignored) points `npm run dev` at dev. Delete it to go back to prod. **Dev admin access:** the app checks `user_metadata.role = 'admin'`, but on dev the admin role is only in `profiles` (dev's `member_admin_and_accounts` migration), so `/admin` is locked on dev until a dev user gets that metadata.

**Files:**
- Create (gitignored, **do not commit**): `.env.development.local` with the dev URL and the publishable/anon key from `mcp__supabase-dev__get_publishable_keys`. Confirm `.gitignore` covers `.env*.local` first.

**Steps:**
1. `npm run build`, then `npm run dev`.
2. Signed out, check: home, `/tournaments`, a tournament detail page, `/stats` (all views, career + each season), `/poy/<year>`, `/nlpi`, `/members/<id>`, compare.
3. Signed in as admin, check the admin tournament list, new tournament, and add sessions.
4. Hand the list to the user for their own pass. **Stop until they approve.**

### Task 9: Lint, format, PR

1. `npx eslint <changed files>` and `npx prettier --write <changed files>`. Commit if there are changes: `chore: lint and format`.
2. Open a PR `feat/tournament-v2-cutover → master`. The description includes the Task 2 decision table, the snapshot diff summary, and the prod rollout steps (Task 10). End the PR body with: 🤖 Generated with [Claude Code](https://claude.com/claude-code)

### Task 10: Prod rollout (user-gated)

**Do not start without explicit user approval in this task.**
1. Re-run the snapshot on prod and save it as `prod-before-rollout.txt`. Diff it against `prod-before.txt`; investigate if new tournament data has appeared since.
2. Prod MCP is read-only, so the user either temporarily removes `&read_only=true` from the prod entry in `.mcp.json` (then restarts or runs `/mcp`), or applies the three migration files themselves in the SQL editor in the same order. Note: applying them through the SQL editor won't record them in the migration history.
3. Apply the migrations from Tasks 3–5 in order. Re-run the snapshot and diff it; the expected differences are the same as on dev.
4. Merge the PR and deploy the app. In the gap between migrating and deploying, the old app still works: v1 tables are untouched and the RPCs return the same output.
5. Smoke-test prod (signed out and admin). Put `read_only=true` back.

### Task 11: Retire v1 tables (separate PR, after a few weeks)

- Migration: rename `tournaments` to `legacy_tournaments` and `tournament_sessions` to `legacy_tournament_sessions`, and revoke write access. A later migration drops them.
- Before renaming, verify that `grep` and `pg_proc` show zero references.

---

## Refinement pass

### Task R1: Lint and Format
**Skill:** lint-and-format. Run Prettier and ESLint on the changed files. Fix any violations. Re-run `npx tsc --noEmit` and `npm run build`.
Commit: `chore: fix lint and format violations`

### Task R2: Reduce Complexity
**Skill:** reduce-complexity. Scan the changed TS files and the new SQL functions for nesting deeper than 3 levels or functions over 30 lines. Refactor where flagged, then re-run the snapshot diff for SQL changes.
Commit: `refactor: reduce complexity in tournament v2 code`

### Task R3: Improve Readability
**Skill:** improve-readability. Look for unclear names, magic numbers (e.g. 40 should come from tournament data, not a literal) and tangled expressions.
Commit: `refactor: improve readability in tournament v2 code`

### Task R4: Make It DRY
**Skill:** make-it-dry. Extract code only if the same pattern appears 3 or more times (likely candidates: prize-pool or buy-in display formatting).
Commit: `refactor: extract shared tournament helpers`

### Task R5: Standards Alignment
**Skill:** standards-alignment. Check against the loaded standards, applied as general guidance to this Next.js/Supabase repo: strict TS, explicit types, no nested loops, early returns, no `console.log`.
Commit: `refactor: align tournament v2 code with standards`

Skip any refinement task that finds nothing to change. No empty commits.
