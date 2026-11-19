# Tournament Clock — Design

- **Date:** 2026-11-18
- **Branch:** `feat/tournament-shot-clock`
- **Status:** Decisions final; screens, sync details, and phases are a proposal pending review.

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
| Payouts | Last paid place gets the clock's buy-in back (whatever it is set to, not a fixed $40); remainder split by % across places above it; no rounding |
| Places paid | Default on the template, editable per clock; **minimum 3** |
| Starter default | 3 paid, 65/35 split for 1st/2nd |
| Player phone view | None in v1; the shared display is enough |
| Tests | Add Vitest for the pure logic |
| Guests in results | Counted in the pool and live placing; excluded from saved sessions; members re-ranked |

### Sync approach (chosen: A)

- **A. DB row + Realtime (chosen):** clock state is timestamps, so it survives refreshes, sleeping phones, and late joiners; RLS gates writes to admins.
- B. Admin device broadcasts ticks: rejected — clock dies if the admin's phone sleeps; no persistence.
- C. DB row + polling: rejected — multi-second lag on pause/skip is visible on a TV.

## Data model

### `blind_structures` (templates)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `name` | text | e.g. "Standard 20-min" |
| `default_buy_in` | numeric | e.g. 40; copied to the clock, where it can be changed |
| `default_rebuy` | numeric | |
| `default_starting_chips` | int | |
| `default_rebuy_chips` | int | |
| `default_places_paid` | int | `>= 3`; starter template uses 3 |
| `default_payout_pcts` | numeric[] | split for places 1..N-1; starter template uses `{65,35}`; must sum to 100 |
| `created_at` | timestamptz | |

### `blind_levels` (template levels)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `structure_id` | uuid fk → `blind_structures` | cascade delete |
| `position` | int | order within structure |
| `kind` | text | `level` \| `break` |
| `small_blind`, `big_blind`, `ante` | int | null for breaks |
| `duration_seconds` | int | |

### `tournament_clocks`

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
| `payout_pcts` | numeric[] | copied, editable until finish |
| `updated_at` | timestamptz | |

### `clock_entrants`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `clock_id` | uuid fk → `tournament_clocks` | cascade delete |
| `member_id` | uuid fk → `members`, nullable | null = guest |
| `guest_name` | text, nullable | required when `member_id` is null |
| `rebuys` | int | default 0 |
| `busted_at` | timestamptz, nullable | null = still in |
| `finish_place` | int, nullable | assigned at bust (players remaining at time of bust) |

Constraint: exactly one of `member_id` / `guest_name` is set; a member appears at most once per clock.

### Derived values (computed, not stored)

- **Players left** = entrants with `busted_at` null (shown by name).
- **Prize pool** = `entrants × buy_in + Σ rebuys × rebuy`.
- **Total chips** = `entrants × starting_chips + Σ rebuys × rebuy_chips`; **avg stack** = total chips ÷ players left.

### Payout rule

Given pool `P`, the clock's `buy_in` `B`, places paid `N` (≥ 3), and `payout_pcts` (length N-1, sums to 100):

1. Place N receives exactly `B`: the clock's configured buy-in, never a hardcoded amount. A $50 buy-in clock pays $50 back. It is the buy-in only, regardless of that player's rebuys.
2. Places 1..N-1 split `P − B` by `payout_pcts`.
3. No rounding.
4. If entrants < N, `N` is reduced to the number of entrants for the calculation. This is the only case below 3 paid.

Example: 12 entrants, $40 buy-in, 4 rebuys at $40 → pool $640. 3 paid, split 65/35 → 3rd $40, 1st $390, 2nd $210.

Common splits for reference:

| Places paid | Split for places above money-back |
|---|---|
| 3 | 65/35 (default), 60/40, 70/30 |
| 4 | 50/30/20, 55/30/15 |
| 5 | 45/28/17/10 |

Validation: warn on the clock setup screen if any computed payout above the money-back spot is ≤ `B` (e.g. a 5-way split that leaves 4th tied with the money-back spot).

### Permissions (RLS)

- `select` open to `anon` and `authenticated` on all four tables (TV and player phones need no login).
- `insert`/`update`/`delete` only when `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`, matching the existing `/admin` gate in `utils/supabase/middleware.ts`.
- Realtime publication enabled for `tournament_clocks` and `clock_entrants`.

## Clock timing

All state transitions are writes of timestamps; nothing ticks in the database.

- **Remaining in current level** = `levels[level_index].duration_ms − (serverNow − level_started_at)`.
- **Start:** `status=running`, `level_index=0`, `level_started_at=now()`.
- **Pause:** `status=paused`, `paused_remaining_ms=<computed remaining>`.
- **Resume:** `status=running`, `level_started_at = now() − (duration − paused_remaining_ms)`, `paused_remaining_ms=null`.
- **Next/prev level:** `level_index ± 1`, `level_started_at=now()`.
- **Adjust time (+/− 1 min):** shift `level_started_at`.
- **Auto-advance:** every client walks forward through `levels` from `level_started_at` to find the effective level, so displays are correct even if nobody writes. The admin control screen, when open, persists the advance with a conditional update (`where level_index = <old>`), so duplicate writes from multiple admin tabs are no-ops.
- **Clock skew:** on load (and on Realtime reconnect) the client fetches server time via a lightweight RPC (`select now()`), measures round trip, and stores `offset = serverTime + rtt/2 − Date.now()`. All countdowns use `Date.now() + offset`.
- Use server time (`now()` in SQL / RPC) for every timestamp written, never the admin device's clock.

## Screens & routes (proposal)

| Route | Who | Purpose |
|---|---|---|
| `/clock/[id]` | Public | Display: level, countdown, current/next blinds & ante, next break, players left (names), avg stack, prize pool & payouts. "TV mode" toggle → fullscreen + Wake Lock. |
| `/admin/clock` | Admin | List clocks; create a clock from a template (pick template, optional tournament link, adjust money/chips/payouts). |
| `/admin/clock/[id]` | Admin | Control: start/pause/resume, prev/next level, ±1 min, add entrants (member picker + guest name), rebuy, bust, undo bust, edit payouts. Includes a live mini-display. |
| `/admin/clock/[id]/finish` | Admin | Review & save results (see Finish flow). |
| `/admin/clock/structures` | Admin | CRUD templates and their levels (add/remove/reorder levels and breaks). |

Code layout follows the repo's convention: `features/clock/{components,hooks,lib,actions}` with thin route files under `app/`.

- `features/clock/lib/` — pure functions: `getEffectiveLevel`, `getRemainingMs`, `computePool`, `computePayouts`, `buildFinishResults`. No React/Supabase imports so they're easy to test.
- `features/clock/hooks/useClock(id)` — initial fetch + Realtime subscription + server-time offset; returns derived state and a `requestAnimationFrame`/interval-driven remaining time.
- `features/clock/actions/` — server actions for every admin mutation; each re-checks admin via `getCurrentUser()` in addition to RLS.

### Entrant actions

- **Bust:** sets `busted_at=now()` and `finish_place = players left before the bust`.
- **Undo bust:** clears both (only for the most recent bust, to keep places consistent).
- **Rebuy:** increments `rebuys`; if the player is busted, also clears `busted_at`/`finish_place` (re-entry).
- The last remaining player gets `finish_place=1` when the admin finishes the clock.

### Sounds & TV mode

- Chimes at the 1-minute warning and at level change, played on display devices.
- Browsers block audio until a user gesture, so the display shows a one-time "Tap to enable sound" control; TV mode entry counts as that gesture.
- TV mode: Fullscreen API + Screen Wake Lock API (re-acquired on `visibilitychange`); fails gracefully where unsupported.

## Finish flow

1. Admin taps **Finish** → `status=finished`; remaining player gets place 1.
2. Review screen builds results from entrants:
   - **Payouts** use true finishing positions (guests included), via the payout rule.
   - **Members only** are kept; places are **re-ranked** among members (1, 2, 3…). Each member's `cash_out` is the payout of their **true** position. E.g. guest wins 1st → member who finished 2nd is saved as place 1 with the 2nd-place payout.
   - Per member: `rebuys` (count), `cash_out`, `place`. Buy-in total, net profit, and points are derived by `_tournament_session_points` (Phase 0), not written.
   - Tournament fields prefilled: `name`, `date`, `week_id` (admin confirms), `places_paid`, `buy_in_amount`, `rebuy_amount`, `player_count` (all entrants incl. guests), `total_rebuys` (incl. guests).
3. Admin edits anything, then confirms → creates (or updates the linked) `_tournaments` row and inserts `_tournament_sessions` for members who played only (no filler rows), then runs the same ranking recalculation, `updateTag(LEAGUE_DATA_TAG)`, and revalidation as today's tournament save.

## Error handling

- **Realtime disconnect:** show a subtle "reconnecting" badge; on reconnect, refetch the clock + entrants and re-sync server time (Realtime doesn't replay missed events).
- **Mutation failure:** server actions return `{ success, message }` like existing actions; control screen shows a toast and reverts any optimistic UI.
- **Concurrent admins:** level advances use conditional updates; bust/rebuy are per-row updates, so last-write-wins is acceptable.
- **Template edits mid-tournament:** no effect on running clocks (levels are snapshotted).
- **Clock past final level:** stays on the last level with the countdown at 0:00 (no wrap).
- **Validation:** `payout_pcts` length = `places_paid − 1` and sums to 100; guest name required when no member.

## Testing

The repo has no test runner today. Add **Vitest** (dev dependency only) for the pure functions in `features/clock/lib/`, which carry all the tricky logic:

- Effective level / remaining time across pause, resume, adjust, and multi-level catch-up after a sleeping tab.
- Pool, avg stack, and payout rule (incl. money-back tracks a non-$40 buy-in, entrants < places paid, payouts at or below money-back warning).
- Finish results: guest re-ranking, true-position cash-outs, net profit.

Realtime/UI verified manually: two browsers (admin + display), pause/skip/bust propagate within ~1s; refresh mid-level shows correct time; phone sleep/wake resyncs.

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

## Implementation phases (proposal)

0. **Tournament v2 cutover** (see Phase 0; own PR, dev first).
1. **Schema:** clock tables, RLS, Realtime publication, `server_now()` RPC; regenerate/extend types.
2. **Pure logic + tests:** `features/clock/lib` with Vitest.
3. **Templates:** `/admin/clock/structures` CRUD.
4. **Clock core:** create clock, `useClock` hook, public display, admin control (timing only).
5. **Entrants:** add members/guests, rebuy, bust/undo, players left, avg stack, pool & payouts on display.
6. **TV mode & sounds.**
7. **Finish flow:** review screen → `_tournaments` + `_tournament_sessions`.
8. **Nav:** admin nav link; link from tournament page when a clock is attached.

## Out of scope for v1

- A personal "my status" view on players' phones; everyone uses the shared `/clock/[id]` display.
- Cash-session v2 cutover (`_cash_sessions`, rebuys table) — separate project.
- Browser notifications and trinkets.
