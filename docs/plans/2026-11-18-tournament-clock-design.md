# Tournament Clock — Design

- **Date:** 2026-11-18
- **Branch:** `feat/tournament-shot-clock`
- **Status:** Data model agreed; screens, sync details, and phases are a proposal pending review.

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
| Payouts | Last paid place gets the buy-in back; remainder split by % across places above it; no rounding |
| Places paid | Default on the template, editable per clock |
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
| `default_buy_in` | numeric | typically 40 |
| `default_rebuy` | numeric | |
| `default_starting_chips` | int | |
| `default_rebuy_chips` | int | |
| `default_places_paid` | int | e.g. 3 |
| `default_payout_pcts` | numeric[] | split for places 1..N-1, e.g. `{65,35}`; must sum to 100 |
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
| `tournament_id` | uuid fk → `tournaments`, nullable | set at creation or by the finish flow |
| `levels` | jsonb | **snapshot** of the template's levels; editing a template never changes a running clock |
| `status` | text | `setup` \| `running` \| `paused` \| `finished` |
| `level_index` | int | last persisted level |
| `level_started_at` | timestamptz | server time the current level (effectively) started |
| `paused_remaining_ms` | int, nullable | set while paused |
| `buy_in`, `rebuy` | numeric | copied from template defaults |
| `starting_chips`, `rebuy_chips` | int | copied from template defaults |
| `places_paid` | int | copied, editable until finish |
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

Given pool `P`, buy-in `B`, places paid `N`, and `payout_pcts` (length N-1, sums to 100):

1. Place N receives exactly `B` (buy-in only, regardless of that player's rebuys).
2. Places 1..N-1 split `P − B` by `payout_pcts`.
3. No rounding.
4. If entrants < N, `N` is reduced to the number of entrants for the calculation.

Example: 12 entrants, $40 buy-in, 4 rebuys at $40 → pool $640. 3 paid, split 65/35 → 3rd $40, 1st $390, 2nd $210.

Validation: if `P − B ≤ 0` (e.g. one paid place), place 1 takes the whole pool.

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
   - `buy_in`, `rebuys` per member from the clock; `net_profit = cash_out − buy_in − rebuys × rebuy`.
   - Points via the existing `assignTournamentSessionPoints` in `utils/tournament/utils.ts`.
   - Tournament fields prefilled: `player_count` (all entrants incl. guests), `buy_ins`, `rebuys`, `money_in_play` (pool), `places_payed`, `date`, `season_id` (admin picks/confirms), `name`.
3. Admin edits anything, then confirms → creates (or updates the linked) `tournaments` row and inserts `tournament_sessions`, reusing the existing add-session action path so NLPI/POY ranking recalculation, `updateTag(LEAGUE_DATA_TAG)`, and revalidation all run as they do today.

> To confirm during implementation: whether the existing session flow fills zero-rows for members who didn't play (`fillMissingSessions`-style helper in `utils/tournament/utils.ts`) and whether the clock handoff should do the same.

## Error handling

- **Realtime disconnect:** show a subtle "reconnecting" badge; on reconnect, refetch the clock + entrants and re-sync server time (Realtime doesn't replay missed events).
- **Mutation failure:** server actions return `{ success, message }` like existing actions; control screen shows a toast and reverts any optimistic UI.
- **Concurrent admins:** level advances use conditional updates; bust/rebuy are per-row updates, so last-write-wins is acceptable.
- **Template edits mid-tournament:** no effect on running clocks (levels are snapshotted).
- **Clock past final level:** stays on the last level with the countdown at 0:00 (no wrap).
- **Validation:** `payout_pcts` length = `places_paid − 1` and sums to 100; guest name required when no member.

## Testing

The repo has no test runner today. Proposal: add **Vitest** for the pure functions in `features/clock/lib/`, which carry all the tricky logic:

- Effective level / remaining time across pause, resume, adjust, and multi-level catch-up after a sleeping tab.
- Pool, avg stack, and payout rule (incl. entrants < places paid, single paid place).
- Finish results: guest re-ranking, true-position cash-outs, net profit.

Realtime/UI verified manually: two browsers (admin + display), pause/skip/bust propagate within ~1s; refresh mid-level shows correct time; phone sleep/wake resyncs.

## Implementation phases (proposal)

1. **Schema:** tables, RLS, Realtime publication, `server_now()` RPC; regenerate/extend types.
2. **Pure logic + tests:** `features/clock/lib` with Vitest.
3. **Templates:** `/admin/clock/structures` CRUD.
4. **Clock core:** create clock, `useClock` hook, public display, admin control (timing only).
5. **Entrants:** add members/guests, rebuy, bust/undo, players left, avg stack, pool & payouts on display.
6. **TV mode & sounds.**
7. **Finish flow:** review screen → tournament + sessions via existing actions.
8. **Nav:** admin nav link; link from tournament page when a clock is attached.

## Open questions

- Exact default payout split(s) for the starter template.
- Should players' phones get a lighter "my status" view, or is the shared display enough for v1?
- Add Vitest as a dev dependency (only new tooling proposed)?
