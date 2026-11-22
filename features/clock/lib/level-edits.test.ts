import { describe, expect, it } from "vitest";
import {
  levelEditLocks,
  type LevelEdit,
  planLevelEdit,
} from "@/features/clock/lib/level-edits";
import type { DraftLevel } from "@/features/clock/lib/structures";
import { getClockPosition } from "@/features/clock/lib/timing";
import {
  makeClock,
  NLPT_STANDARD_LEVELS,
  satisfiesStatusRule,
} from "@/features/clock/lib/test-fixtures";
import type { BlindLevel, TournamentClock } from "@/features/clock/types";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

// Level 3 (index 2) started five minutes before `nowMs`.
function runningClock(startOffsetMs = -5 * MINUTE) {
  const nowMs = START_MS;
  const clock = makeClock({
    status: "running",
    level_index: 2,
    level_started_at: new Date(nowMs + startOffsetMs).toISOString(),
  });
  return { clock, nowMs };
}

function withLength(
  levels: BlindLevel[],
  index: number,
  minutes: number,
): BlindLevel[] {
  return levels.map((level, i) =>
    i === index ? { ...level, duration_seconds: minutes * 60 } : level,
  );
}

function planned(
  clock: TournamentClock,
  levels: BlindLevel[],
  nowMs: number,
): { edit: LevelEdit; updated: TournamentClock } {
  const result = planLevelEdit(clock, levels, nowMs);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  const updated = { ...clock, ...result.value };
  expect(satisfiesStatusRule(updated)).toBe(true);
  return { edit: result.value, updated };
}

function minutesLeft(clock: TournamentClock, nowMs: number): number {
  return getClockPosition(clock, nowMs).remainingMs / MINUTE;
}

describe("levelEditLocks", () => {
  it("lets everything change in setup", () => {
    expect(levelEditLocks("setup", 0)).toEqual({
      firstEditable: 0,
      firstMovable: 0,
    });
  });

  it("locks played rows and pins the current row while running or paused", () => {
    const locks = { firstEditable: 4, firstMovable: 5 };
    expect(levelEditLocks("running", 4)).toEqual(locks);
    expect(levelEditLocks("paused", 4)).toEqual(locks);
  });

  it("allows no edits once finished", () => {
    expect(levelEditLocks("finished", 4)).toBeNull();
  });
});

describe("planLevelEdit in setup", () => {
  it("saves a reordered and shortened list whole", () => {
    const sent = [...NLPT_STANDARD_LEVELS].reverse().slice(0, 5);
    const { edit } = planned(makeClock(), sent, START_MS);
    expect(edit).toEqual({ levels: sent, level_index: 0 });
  });

  it("refuses a bad row", () => {
    const sent = [{ ...NLPT_STANDARD_LEVELS[0], big_blind: 1 }];
    expect(planLevelEdit(makeClock(), sent, START_MS)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });

  it("refuses a list with nothing to play", () => {
    const sent = [NLPT_STANDARD_LEVELS[4]];
    expect(planLevelEdit(makeClock(), sent, START_MS)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });

  it("saves only the stored fields, with a note only on breaks that have one", () => {
    const sent = [
      { ...NLPT_STANDARD_LEVELS[0], key: "a" },
      { ...NLPT_STANDARD_LEVELS[4], note: " Color up ", key: "b" },
      { ...NLPT_STANDARD_LEVELS[4], note: "  ", key: "c" },
    ] satisfies DraftLevel[];
    const { edit } = planned(makeClock(), sent, START_MS);
    expect(edit.levels).toEqual([
      { ...NLPT_STANDARD_LEVELS[0] },
      { ...NLPT_STANDARD_LEVELS[4], note: "Color up" },
      { ...NLPT_STANDARD_LEVELS[4] },
    ]);
    expect(edit.levels.every((level) => !("key" in level))).toBe(true);
    expect("note" in edit.levels[2]).toBe(false);
  });
});

describe("planLevelEdit while running", () => {
  it("keeps the time played when the level is lengthened", () => {
    const { clock, nowMs } = runningClock();
    const sent = withLength(clock.levels, 2, 30);
    const { updated } = planned(clock, sent, nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(25);
    expect(updated.status).toBe("running");
    expect(updated.paused_remaining_ms).toBeNull();
  });

  it("keeps the time played when the level is shortened", () => {
    const { clock, nowMs } = runningClock();
    const { updated } = planned(clock, withLength(clock.levels, 2, 10), nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(5);
  });

  it("ends the level now when the new length is already used up", () => {
    const { clock, nowMs } = runningClock();
    const { updated } = planned(clock, withLength(clock.levels, 2, 4), nowMs);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 3,
      remainingMs: 20 * MINUTE,
    });
  });

  it("keeps time added with +1 min after a length change", () => {
    const { clock, nowMs } = runningClock(2 * MINUTE);
    expect(minutesLeft(clock, nowMs)).toBe(22);
    const { updated } = planned(clock, withLength(clock.levels, 2, 30), nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(32);
  });

  it("keeps played rows as saved even when the sent ones changed", () => {
    const { clock, nowMs } = runningClock();
    const sent = clock.levels.map((level, i) =>
      i < 2 ? { ...level, small_blind: 1, big_blind: 2 } : level,
    );
    const { edit } = planned(clock, sent, nowMs);
    expect(edit.levels.slice(0, 2)).toEqual(clock.levels.slice(0, 2));
  });

  it("makes the current level last when every upcoming row is removed", () => {
    const { clock, nowMs } = runningClock();
    const { updated } = planned(clock, clock.levels.slice(0, 3), nowMs);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 2,
      isLastLevel: true,
    });
    expect(minutesLeft(updated, nowMs + 30 * MINUTE)).toBe(0);
  });

  it("catches up when the saved level is behind the effective level", () => {
    const nowMs = START_MS + 25 * MINUTE;
    const clock = makeClock({
      status: "running",
      level_index: 0,
      level_started_at: new Date(START_MS).toISOString(),
    });
    expect(getClockPosition(clock, nowMs).levelIndex).toBe(1);
    const sent = withLength(clock.levels, 1, 30);
    const { updated } = planned(clock, sent, nowMs);
    expect(updated.level_index).toBe(1);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 1,
      remainingMs: 25 * MINUTE,
    });
  });

  it("refuses a list too short for the current level", () => {
    const { clock, nowMs } = runningClock();
    expect(planLevelEdit(clock, clock.levels.slice(0, 2), nowMs)).toEqual({
      ok: false,
      reason: "clock_moved",
    });
  });

  it("refuses an invalid upcoming row", () => {
    const { clock, nowMs } = runningClock();
    const sent = clock.levels.map((level, i) =>
      i === 5 ? { ...level, duration_seconds: 0 } : level,
    );
    expect(planLevelEdit(clock, sent, nowMs)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });
});

describe("planLevelEdit while paused", () => {
  function paused(): TournamentClock {
    return makeClock({
      status: "paused",
      level_index: 2,
      paused_remaining_ms: 12 * MINUTE,
    });
  }

  it("adds the extra length to the time left", () => {
    const clock = paused();
    const { updated } = planned(
      clock,
      withLength(clock.levels, 2, 25),
      START_MS,
    );
    expect(minutesLeft(updated, START_MS)).toBe(17);
    expect(updated.status).toBe("paused");
  });

  it("runs out the level when shortened below the time played", () => {
    const clock = paused();
    const { updated } = planned(
      clock,
      withLength(clock.levels, 2, 5),
      START_MS,
    );
    expect(minutesLeft(updated, START_MS)).toBe(0);
  });
});

describe("planLevelEdit when finished", () => {
  it("refuses", () => {
    const clock = makeClock({ status: "finished", paused_remaining_ms: 0 });
    expect(planLevelEdit(clock, clock.levels, START_MS)).toEqual({
      ok: false,
      reason: "finished",
    });
  });
});
