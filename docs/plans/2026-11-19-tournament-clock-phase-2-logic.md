# Tournament Clock Phase 2 (Pure Logic) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Write and test every calculation the clock needs (current level and time left, clock controls, money, bust order, rebuy rules and finish results) as pure functions under `features/clock/lib/`, with Vitest as the repo's first test runner.

**Architecture:** Plain TypeScript functions with no React, Supabase or `Date.now()` inside. Callers pass the current time as `nowMs` (already corrected to server time), so every result can be tested exactly. Clock controls return the **row changes** to write to `_tournament_clocks` / `_clock_entrants`, and phase 4/5 server actions write them. The rules repeat the database checks from phase 1, so the app explains a problem before the database has to reject it.

**Tech Stack:** TypeScript (strict), Vitest (new dev dependency).

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, no nested loops, single responsibility). TDD per task. Repo conventions: `features/<feature>/lib` for logic, `@/` path alias, Prettier and ESLint on changed files, no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md`. Phase 1 (schema, types): `docs/plans/2026-11-19-tournament-clock-phase-1-schema.md`. Branch: `feat/tournament-shot-clock`.

---

## Ground rules

- No database changes in this phase.
- Every file in `features/clock/lib/` imports only from `features/clock/types.ts` and other `lib` files.
- Time is `number` milliseconds in, ISO `string` out (for `timestamptz` columns): `new Date(ms).toISOString()`.
- Money is not rounded in calculations (design decision). Formatting to cents happens where it's displayed or saved (phase 4/7). Tests compare money with `toBeCloseTo(x, 6)`.
- Functions that can refuse an action return a result union, not a throw:
  `type Result<T> = { ok: true; value: T } | { ok: false; reason: <string literal union> }`.
  Define `Result` once in `features/clock/lib/result.ts`. Throw only for programmer errors (for example a bad `levels` payload in `parseLevels`).
- Tests live next to the code: `features/clock/lib/<name>.test.ts`. Shared builders go in `features/clock/lib/test-fixtures.ts`.

## Facts (checked 2026-11-19)

- No test runner, no `test` or `lint` script in `package.json`. Path alias `@/*` → `./*` in `tsconfig.json`.
- Latest Vitest is 5.1.0.
- Types from phase 1: `BlindLevel`, `TournamentClock`, `ClockEntrant`, `ClockStatus` in `features/clock/types.ts`.
- The seeded `NLPT Standard` structure (19 rows, 5h 50m) is the realistic fixture.

---

### Task 1: Vitest, fixtures and `parseLevels`

**Files:**
- Modify: `package.json` (dev dependency `vitest@^5.1.0`; scripts `"test": "vitest run"`, `"test:watch": "vitest"`)
- Create: `vitest.config.mts`: `environment: "node"`, `include: ["**/*.test.ts"]`, exclude `node_modules` and `.next`, `resolve.alias` `@` → project root.
- Create: `features/clock/lib/result.ts` (the `Result` type and `ok()` / `fail()` helpers)
- Create: `features/clock/lib/test-fixtures.ts`
  - `NLPT_STANDARD_LEVELS: BlindLevel[]` (the 19 seeded rows: 16 levels of 1200 s, breaks of 600 s after levels 4, 8 and 12)
  - `makeClock(overrides?: Partial<TournamentClock>): TournamentClock` (defaults: setup, level 0, NLPT Standard money and payouts, max 2 rebuys)
  - `makeEntrant(overrides?: Partial<ClockEntrant>): ClockEntrant` (a guest by default, ids unique per call)
- Create: `features/clock/lib/levels.ts`, `features/clock/lib/levels.test.ts`

**Contract (`levels.ts`):**
- `parseLevels(value: unknown): BlindLevel[]`: validates a `_tournament_clocks.levels` payload. Throws `Error` with the bad index for: not a non-empty array; unknown `kind`; non-positive integer `duration_seconds`; a break with blinds; a level without `small_blind > 0` and `big_blind >= small_blind`; a negative `ante`. These are the same rules as `_blind_levels`.
- `levelDurationMs(level: BlindLevel): number`
- `scheduleLengthMs(levels: BlindLevel[]): number`
- `levelNumber(levels, index): number | null`: the 1-based number of a playing level, counting levels only (index 5 in NLPT Standard → level 5). `null` for a break.

**Tests:**
- NLPT Standard parses unchanged; `scheduleLengthMs` = 5h 50m (21,000,000 ms).
- Each bad shape above throws.
- `levelNumber`: index 0 → 1, index 4 (break) → null, index 5 → 5, index 18 → 16.

**Verify:** `npm test` passes; `npx tsc --noEmit` has no errors outside `.next/`.

**Commit:** `test: add vitest with clock level parsing`

### Task 2: Where the clock is now

**Files:** Create `features/clock/lib/timing.ts`, `features/clock/lib/timing.test.ts`

**Contract:**
```ts
type ClockPosition = {
  levelIndex: number;      // the effective level, after catching up
  levelStartedAtMs: number | null; // effective start of that level (running only)
  remainingMs: number;     // never negative
  isLastLevel: boolean;
};
getClockPosition(clock: TournamentClock, nowMs: number): ClockPosition
```

**Key logic:**
- `setup`: the stored `level_index`, full duration.
- `paused`: the stored `level_index`, `paused_remaining_ms`.
- `finished`: the stored `level_index`, `paused_remaining_ms ?? 0`.
- `running`: `elapsed = nowMs − level_started_at`. While `elapsed >= duration` of the current level and it isn't the last, subtract the duration and move to the next level (adding it to `levelStartedAtMs`). On the last level, `remainingMs = max(0, duration − elapsed)` and the clock stays there (no wrap). A negative `elapsed` (time added, or a slightly fast screen) gives a remaining time above the duration; that's allowed.
- A stored `level_index` past the end is treated as the last level.

**Tests** (NLPT Standard):
- Setup → level 0, 20:00 left.
- Running, 5 min in → level 0, 15:00 left.
- Running, exactly 20 min in → level 1, 20:00 left, `levelStartedAtMs` = start + 20 min.
- Running, 85 min in → index 4 (first break), 5:00 left. Catching up across several levels works after a sleeping tab.
- Running, 6 h in → last level, 0 left, `isLastLevel` true.
- Running from a stored `level_index` of 3, 25 min in → index 4 (break), 5:00 left.
- Paused with 123,000 ms left → that exactly, whatever `nowMs` is.
- Running with `level_started_at` 30 s in the future → 20:30 left.

**Commit:** `feat: clock position from stored timestamps`

### Task 3: Clock controls

**Files:** Modify `features/clock/lib/timing.ts`, `features/clock/lib/timing.test.ts`

**Contract:** Each returns `Result<ClockUpdate>`, where `ClockUpdate = Partial<Pick<TournamentClock, "status" | "level_index" | "level_started_at" | "paused_remaining_ms">>`. The result always satisfies the phase 1 status check (setup: no timestamps; running: `level_started_at` and no `paused_remaining_ms`; paused: `paused_remaining_ms`).
- `startClock(clock, nowMs)`: setup only → running at the stored level, started now.
- `pauseClock(clock, nowMs)`: running only → paused; saves the caught-up `level_index` and its `remainingMs`; `level_started_at` null.
- `resumeClock(clock, nowMs)`: paused only → running; `level_started_at = now − (duration − paused_remaining_ms)`; `paused_remaining_ms` null.
- `goToLevel(clock, index, nowMs)`: running or paused; index must be in range. The new level starts with its full time: running sets `level_started_at` to now; paused sets `paused_remaining_ms` to the full duration. Used for previous/next.
- `adjustTime(clock, deltaMs, nowMs)`: running or paused. Running: catch up first, then move the effective start by `−deltaMs` (adding time starts the level later). Paused: change `paused_remaining_ms`. Remaining time never goes below 0; it can go above the level's duration.
- `catchUpUpdate(clock, nowMs): ClockUpdate | null`: for running clocks whose effective level is past the stored one, the update that saves it (`level_index`, `level_started_at`); otherwise `null`. Phase 4 writes it with `where level_index = <old>` so two admin tabs can't double-advance.
- `finishClock(clock, nowMs)`: from running or paused → finished, saving the caught-up level, `paused_remaining_ms` = remaining, `level_started_at` null.
- Refusal reasons: `"wrong_status"`, `"level_out_of_range"`.

**Tests:**
- Each control from its allowed status gives the expected update, and every result passes a test helper that applies the phase 1 status rule.
- Each control from a wrong status returns `wrong_status`.
- Pause 5 min into level 0, resume 10 min later → `getClockPosition` right after the resume shows 15:00 left on level 0.
- Pause on a running clock that slept through two levels saves the caught-up level.
- `adjustTime(+60_000)` running at 15:00 left → 16:00 left; `adjustTime(−20 min)` at 15:00 left → level advances (remaining 0 on the old level means the next one is effective), with no negative time.
- `goToLevel` to −1 or 19 → `level_out_of_range`.
- `catchUpUpdate` is `null` when on the stored level and an update when behind.

**Commit:** `feat: clock controls as row updates`

### Task 4: What's next, server time and display text

**Files:** Modify `features/clock/lib/timing.ts` and its test; create `features/clock/lib/format.ts`, `features/clock/lib/format.test.ts`

**Contract:**
- `nextPlayingLevel(levels, index): BlindLevel | null`: the next `kind: "level"` after `index`.
- `timeToNextBreakMs(levels, position): number | null`: the current level's remaining time plus the full durations of the levels between it and the next break; `null` when there's no break ahead or the current row is a break.
- `serverOffsetMs({ sentAtMs, receivedAtMs, serverTimeMs }): number` = `serverTimeMs + (receivedAtMs − sentAtMs) / 2 − receivedAtMs`. Phase 4's `useClock` calls `server_now()` and uses `Date.now() + offset`.
- `formatClockTime(ms): string`: rounds **up** to the whole second (a screen shows 0:01 until time is truly up); `m:ss` under an hour, `h:mm:ss` from an hour.
- `formatBlinds(level): string`: `"1,000 / 2,000"`, with `" (ante 200)"` only when the ante > 0; `"Break"` for a break.

**Tests:**
- Index 0 (level 1) with 10:00 left → next break in 10 + 60 (levels 2–4) = 70 min; on the last level → null; during a break → null.
- `nextPlayingLevel` from index 3 skips the break to 400/800.
- Offset: sent 1000, received 1200, server 5000 → 3900.
- Format: 0 → "0:00", 1 → "0:01", 59,001 → "1:00", 1,200,000 → "20:00", 3,600,000 → "1:00:00".
- Blinds: 1000/2000 → "1,000 / 2,000"; a break → "Break".

**Commit:** `feat: upcoming levels, server offset and clock formatting`

### Task 5: Money and chips

**Files:** Create `features/clock/lib/money.ts`, `features/clock/lib/money.test.ts`

**Contract:**
- `computePool(clock, entrants): number` = entrants × `buy_in` + total rebuys × `rebuy` (guests included; busted players still count).
- `computeChips(clock, entrants): { totalChips: number; playersLeft: number; averageStack: number | null }`. `averageStack` is null with no one left.
- `computePayouts(pool, payoutPcts, entrantCount): number[]`: index 0 is 1st place. Pays `min(payoutPcts.length, entrantCount)` places. When fewer players than paid places, the shares of the places that are paid are scaled to sum to 100. 0 entrants → `[]`. Not rounded.

**Tests:**
- 12 entrants, 4 rebuys, $40/$40 → pool $640; 45/30/15/10 → 288, 192, 96, 64.
- A $50 buy-in and $25 rebuy clock: pool uses those, not $40.
- 3 entrants, 4 paid → 3 places at 50, 33.33…, 16.66… % of the pool, summing to the pool.
- Payouts always sum to the pool (for every entrant count from 1 to 16 with NLPT Standard).
- Chips: 10 entrants, 3 rebuys, 2 busted → total 260,000, 8 left, average 32,500; everyone busted → average null.

**Commit:** `feat: prize pool, payouts and chip counts`

### Task 6: Bust order and rebuy rules

**Files:** Create `features/clock/lib/entrants.ts`, `features/clock/lib/entrants.test.ts`

**Contract:**
- `playersLeft(entrants): ClockEntrant[]` (not busted).
- `planBust(entrants, entrantId, nowMs): Result<{ busted_at: string; finish_place: number }>`: `finish_place` = players left before this bust. Refuses `"not_found"`, `"already_busted"`, `"last_player"` (the last player is placed 1st by `planFinish`, not busted).
- `planUndoBust(entrants, entrantId): Result<{ busted_at: null; finish_place: null }>`: only the **most recent** bust (the busted entrant with the lowest `finish_place`), so places stay consecutive. Refuses `"not_found"`, `"not_busted"`, `"not_most_recent"`.
- `planRebuy(clock, entrants, entrantId): Result<{ rebuys: number; busted_at: null; finish_place: null }>`:
  - Clock must be running or paused → else `"wrong_status"`.
  - `rebuys < max_rebuys` → else `"max_rebuys"`.
  - Players left (before the rebuy) must be greater than `places_paid` → else `"in_the_money"`.
  - A busted player rebuying re-enters (bust cleared), so they must be the most recent bust, like undo → else `"not_most_recent"`. Without this, the next bust would reuse a place that's taken.
- `planFinish(entrants): Result<{ entrantId: string; finish_place: 1 }>`: exactly one player left → that player is 1st; refuses `"players_remaining"` when more than one, `"no_players"` when none.

**Tests:**
- 10 entrants: first bust gets place 10, next gets 9; busting the same player twice → `already_busted`; busting the last player → `last_player`.
- Undo the most recent bust → cleared; undo an earlier bust → `not_most_recent`.
- Rebuy at 2 rebuys with max 2 → `max_rebuys`.
- 5 left, 4 paid: rebuy allowed; 4 left: `in_the_money`.
- The most recent bust rebuys → bust cleared and rebuys + 1; an earlier bust → `not_most_recent`.
- Setup or finished clock → `wrong_status`.
- `planFinish` with one player left → place 1; with two → `players_remaining`.

**Commit:** `feat: bust order and rebuy rules`

### Task 7: Finish results

**Files:** Create `features/clock/lib/results.ts`, `features/clock/lib/results.test.ts`

**Contract:**
```ts
type FinishResults = {
  tournament: {
    places_paid: number;    // places actually paid: min(clock.places_paid, entrants)
    buy_in_amount: number;
    rebuy_amount: number;
    player_count: number;   // all entrants, guests included
    total_rebuys: number;   // guests included
  };
  sessions: { member_id: string; rebuys: number; cash_out: number; place: number }[];
};
buildFinishResults(clock, entrants): Result<FinishResults>
```

**Key logic:**
- Every entrant must have a `finish_place` (run `planFinish` first) → else `"unplaced_entrants"`.
- Payouts come from `computePayouts` by **true** finishing place, guests included.
- Members only, sorted by true place, re-ranked 1, 2, 3…. Each keeps the payout of their **true** place (0 when out of the money).
- Name, date and week are chosen on the review screen (phase 7), not here. Buy-in, net profit and points are calculated by `_tournament_session_points`.

**Tests:**
- A guest wins: the member who finished 2nd is saved as place 1 with the 2nd-place payout.
- A member who finished 5th with 4 paid gets `cash_out` 0.
- `player_count` and `total_rebuys` include guests; the sessions' cash-outs plus the guests' payouts equal the pool.
- 3 entrants with 4 paid → `places_paid` 3.
- An entrant without a place → `unplaced_entrants`.

**Commit:** `feat: build tournament results from a finished clock`

### Task 8: Record decisions in the design doc

**Files:** Modify `docs/plans/2026-11-18-tournament-clock-design.md`

**Changes:**
- Entrant actions: a busted player can rebuy (re-enter) only if they're the most recent bust, the same rule as undo, so places stay consecutive.
- Finish: `places_paid` saved to `_tournaments` is the number of places actually paid.
- Payout rule for fewer players than paid places: the paid places' shares are scaled to sum to 100 (already in the doc; confirm wording).
- Testing: Vitest is set up (`npm test`); list the `features/clock/lib` files.
- Mark phase 2 done.

**Commit:** `docs: record clock phase 2 decisions`

---

## Refinement pass

### Task R1: Lint and Format
**Skill:** lint-and-format. Prettier and ESLint on `features/clock/lib/*`, `vitest.config.mts`, `package.json`. `npx tsc --noEmit` (ignore stale `.next/` errors) and `npm test`.
Commit: `chore: fix lint and format violations` (skip if clean)

### Task R2: Reduce Complexity
**Skill:** reduce-complexity. Watch `getClockPosition`'s catch-up loop and `planRebuy`'s checks (guard clauses, one reason each).
Commit: `refactor: simplify clock logic` (skip if nothing to change)

### Task R3: Improve Readability
**Skill:** improve-readability. Name magic numbers (`MS_PER_SECOND`, etc.) and keep refusal reasons as exported string-literal types.
Commit: `refactor: clarify clock logic names` (skip if nothing to change)

### Task R4: Make It DRY
**Skill:** make-it-dry. Likely candidates: "most recent bust" (undo and rebuy), "catch up then act" (pause, adjust, finish, catch-up). Extract only what appears 3+ times or is clearly the same rule.
Commit: `refactor: share clock helpers` (skip if nothing to change)

### Task R5: Standards Alignment
**Skill:** standards-alignment. Explicit return types on exports, no `any`, no nested loops, no `console.log`.
Commit: `refactor: align clock logic with standards` (skip if nothing to change)

## Next phases (not in this plan)

3. Template editor (`/admin/clock/structures`).
4. Clock core: create a clock, `useClock` (Realtime + `serverOffsetMs`), display, admin controls using Task 3's updates. **Apply phase 1's migrations to prod with this PR.**
5. Entrants (Task 5–6 logic). 6. TV mode and sounds. 7. Finish step (Task 7). 8. Navigation and the live banner.
