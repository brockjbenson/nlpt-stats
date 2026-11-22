import { describe, expect, it } from "vitest";
import type { Result } from "@/features/clock/lib/result";
import {
  makeClock,
  NLPT_STANDARD_LEVELS,
  satisfiesStatusRule,
} from "@/features/clock/lib/test-fixtures";
import {
  adjustTime,
  catchUpUpdate,
  type ClockControlRefusal,
  type ClockUpdate,
  finishClock,
  getClockPosition,
  goToLevel,
  nextPlayingLevel,
  pauseClock,
  resumeClock,
  serverOffsetMs,
  startClock,
  timeToNextBreakMs,
} from "@/features/clock/lib/timing";
import type { TournamentClock } from "@/features/clock/types";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

function runningClock(minutesIn: number, levelIndex = 0) {
  return {
    clock: makeClock({
      status: "running",
      level_index: levelIndex,
      level_started_at: new Date(START_MS).toISOString(),
    }),
    nowMs: START_MS + minutesIn * MINUTE,
  };
}

describe("getClockPosition", () => {
  it("shows the first level's full time in setup", () => {
    expect(getClockPosition(makeClock(), START_MS)).toEqual({
      levelIndex: 0,
      levelStartedAtMs: null,
      remainingMs: 20 * MINUTE,
      isLastLevel: false,
    });
  });

  it("counts down while running", () => {
    const { clock, nowMs } = runningClock(5);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 0,
      levelStartedAtMs: START_MS,
      remainingMs: 15 * MINUTE,
    });
  });

  it("moves to the next level exactly when time runs out", () => {
    const { clock, nowMs } = runningClock(20);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 1,
      levelStartedAtMs: START_MS + 20 * MINUTE,
      remainingMs: 20 * MINUTE,
    });
  });

  it("catches up across several levels after a sleeping screen", () => {
    const { clock, nowMs } = runningClock(85);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 4,
      levelStartedAtMs: START_MS + 80 * MINUTE,
      remainingMs: 5 * MINUTE,
    });
  });

  it("catches up from a saved level part way through", () => {
    const { clock, nowMs } = runningClock(25, 3);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 4,
      remainingMs: 5 * MINUTE,
    });
  });

  it("stays on the last level at zero once the schedule is over", () => {
    const { clock, nowMs } = runningClock(6 * 60);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 18,
      remainingMs: 0,
      isLastLevel: true,
    });
  });

  it("allows more than a full level when the start is in the future", () => {
    const { clock, nowMs } = runningClock(-0.5);
    expect(getClockPosition(clock, nowMs)).toMatchObject({
      levelIndex: 0,
      remainingMs: 20.5 * MINUTE,
    });
  });

  it("shows the saved time while paused, whatever the time is", () => {
    const clock = makeClock({
      status: "paused",
      level_index: 6,
      paused_remaining_ms: 123_000,
    });
    expect(getClockPosition(clock, START_MS + 999 * MINUTE)).toEqual({
      levelIndex: 6,
      levelStartedAtMs: null,
      remainingMs: 123_000,
      isLastLevel: false,
    });
  });

  it("shows the saved time when finished, or zero without one", () => {
    const saved = makeClock({
      status: "finished",
      level_index: 9,
      paused_remaining_ms: 45_000,
    });
    const unsaved = makeClock({ status: "finished", level_index: 9 });
    expect(getClockPosition(saved, START_MS).remainingMs).toBe(45_000);
    expect(getClockPosition(unsaved, START_MS).remainingMs).toBe(0);
  });

  it("shows the full level time if a running clock has no start time", () => {
    const clock = makeClock({ status: "running", level_index: 2 });
    expect(getClockPosition(clock, START_MS)).toMatchObject({
      levelIndex: 2,
      remainingMs: 20 * MINUTE,
    });
  });

  it("treats a saved level past the end as the last level", () => {
    const clock = makeClock({ level_index: 40 });
    expect(getClockPosition(clock, START_MS)).toMatchObject({
      levelIndex: 18,
      isLastLevel: true,
    });
  });
});

// Applies a control's update, failing the test if it was refused or would
// break the database rule.
function apply(
  clock: TournamentClock,
  result: Result<ClockUpdate, ClockControlRefusal>,
): TournamentClock {
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  const updated = { ...clock, ...result.value };
  expect(satisfiesStatusRule(updated)).toBe(true);
  return updated;
}

function pausedClock(levelIndex: number, remainingMs: number): TournamentClock {
  return makeClock({
    status: "paused",
    level_index: levelIndex,
    paused_remaining_ms: remainingMs,
  });
}

describe("startClock", () => {
  it("starts the saved level now", () => {
    const clock = apply(makeClock(), startClock(makeClock(), START_MS));
    expect(clock).toMatchObject({
      status: "running",
      level_index: 0,
      level_started_at: new Date(START_MS).toISOString(),
      paused_remaining_ms: null,
    });
    expect(getClockPosition(clock, START_MS).remainingMs).toBe(20 * MINUTE);
  });

  it("only starts a clock in setup", () => {
    const { clock, nowMs } = runningClock(5);
    expect(startClock(clock, nowMs)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("pauseClock and resumeClock", () => {
  it("pauses with the time left and resumes from it", () => {
    const { clock, nowMs } = runningClock(5);
    const paused = apply(clock, pauseClock(clock, nowMs));
    expect(paused).toMatchObject({
      status: "paused",
      level_index: 0,
      level_started_at: null,
      paused_remaining_ms: 15 * MINUTE,
    });

    const resumeMs = nowMs + 10 * MINUTE;
    const resumed = apply(paused, resumeClock(paused, resumeMs));
    expect(resumed.status).toBe("running");
    expect(getClockPosition(resumed, resumeMs)).toMatchObject({
      levelIndex: 0,
      remainingMs: 15 * MINUTE,
    });
    expect(getClockPosition(resumed, resumeMs + 15 * MINUTE).levelIndex).toBe(
      1,
    );
  });

  it("saves the caught-up level when pausing after a sleeping screen", () => {
    const { clock, nowMs } = runningClock(45);
    expect(apply(clock, pauseClock(clock, nowMs))).toMatchObject({
      level_index: 2,
      paused_remaining_ms: 15 * MINUTE,
    });
  });

  it("keeps added time when resuming", () => {
    const paused = pausedClock(0, 25 * MINUTE);
    const resumed = apply(paused, resumeClock(paused, START_MS));
    expect(getClockPosition(resumed, START_MS).remainingMs).toBe(25 * MINUTE);
  });

  it("only pauses a running clock and resumes a paused one", () => {
    expect(pauseClock(makeClock(), START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
    const { clock, nowMs } = runningClock(5);
    expect(resumeClock(clock, nowMs)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("goToLevel", () => {
  it("starts the chosen level with its full time while running", () => {
    const { clock, nowMs } = runningClock(5);
    const moved = apply(clock, goToLevel(clock, 4, nowMs));
    expect(getClockPosition(moved, nowMs)).toMatchObject({
      levelIndex: 4,
      remainingMs: 10 * MINUTE,
    });
  });

  it("gives the chosen level its full time while paused", () => {
    const paused = pausedClock(3, MINUTE);
    expect(apply(paused, goToLevel(paused, 2, START_MS))).toMatchObject({
      status: "paused",
      level_index: 2,
      paused_remaining_ms: 20 * MINUTE,
    });
  });

  it.each([-1, 19])("refuses level index %i", (index) => {
    const { clock, nowMs } = runningClock(5);
    expect(goToLevel(clock, index, nowMs)).toEqual({
      ok: false,
      reason: "level_out_of_range",
    });
  });

  it("refuses before the start and after the finish", () => {
    expect(goToLevel(makeClock(), 1, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
    const finished = makeClock({ status: "finished" });
    expect(goToLevel(finished, 1, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("adjustTime", () => {
  it("adds a minute while running", () => {
    const { clock, nowMs } = runningClock(5);
    const adjusted = apply(clock, adjustTime(clock, MINUTE, nowMs));
    expect(getClockPosition(adjusted, nowMs)).toMatchObject({
      levelIndex: 0,
      remainingMs: 16 * MINUTE,
    });
  });

  it("removes a minute while running", () => {
    const { clock, nowMs } = runningClock(5);
    const adjusted = apply(clock, adjustTime(clock, -MINUTE, nowMs));
    expect(getClockPosition(adjusted, nowMs).remainingMs).toBe(14 * MINUTE);
  });

  it("ends the level, without negative time, when removing more than is left", () => {
    const { clock, nowMs } = runningClock(5);
    const adjusted = apply(clock, adjustTime(clock, -20 * MINUTE, nowMs));
    expect(getClockPosition(adjusted, nowMs)).toMatchObject({
      levelIndex: 1,
      remainingMs: 20 * MINUTE,
    });
  });

  it("adds a full minute to a last level that has run out", () => {
    const { clock, nowMs } = runningClock(7 * 60);
    const adjusted = apply(clock, adjustTime(clock, MINUTE, nowMs));
    expect(getClockPosition(adjusted, nowMs)).toMatchObject({
      levelIndex: 18,
      remainingMs: MINUTE,
    });
  });

  it("catches up before adjusting", () => {
    const { clock, nowMs } = runningClock(45);
    const adjusted = apply(clock, adjustTime(clock, MINUTE, nowMs));
    expect(adjusted.level_index).toBe(2);
    expect(getClockPosition(adjusted, nowMs).remainingMs).toBe(16 * MINUTE);
  });

  it("changes the saved time while paused, never below zero", () => {
    const paused = pausedClock(0, 30_000);
    expect(apply(paused, adjustTime(paused, MINUTE, START_MS))).toMatchObject({
      paused_remaining_ms: 90_000,
    });
    expect(apply(paused, adjustTime(paused, -MINUTE, START_MS))).toMatchObject({
      paused_remaining_ms: 0,
    });
  });

  it("refuses before the start", () => {
    expect(adjustTime(makeClock(), MINUTE, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("catchUpUpdate", () => {
  it("is null while on the saved level", () => {
    const { clock, nowMs } = runningClock(5);
    expect(catchUpUpdate(clock, nowMs)).toBeNull();
  });

  it("saves the effective level and its start when behind", () => {
    const { clock, nowMs } = runningClock(45);
    expect(catchUpUpdate(clock, nowMs)).toEqual({
      level_index: 2,
      level_started_at: new Date(START_MS + 40 * MINUTE).toISOString(),
    });
  });

  it("is null unless running", () => {
    expect(catchUpUpdate(pausedClock(0, MINUTE), START_MS)).toBeNull();
  });
});

describe("finishClock", () => {
  it("stops a running clock on its caught-up level", () => {
    const { clock, nowMs } = runningClock(45);
    expect(apply(clock, finishClock(clock, nowMs))).toMatchObject({
      status: "finished",
      level_index: 2,
      level_started_at: null,
      paused_remaining_ms: 15 * MINUTE,
    });
  });

  it("finishes a paused clock", () => {
    const paused = pausedClock(7, MINUTE);
    expect(apply(paused, finishClock(paused, START_MS))).toMatchObject({
      status: "finished",
      level_index: 7,
      paused_remaining_ms: MINUTE,
    });
  });

  it("refuses before the start or twice", () => {
    expect(finishClock(makeClock(), START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
    const finished = makeClock({ status: "finished" });
    expect(finishClock(finished, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("nextPlayingLevel", () => {
  it("returns the next level", () => {
    expect(nextPlayingLevel(NLPT_STANDARD_LEVELS, 0)).toMatchObject({
      small_blind: 150,
      big_blind: 300,
    });
  });

  it("skips a break", () => {
    expect(nextPlayingLevel(NLPT_STANDARD_LEVELS, 3)).toMatchObject({
      small_blind: 300,
      big_blind: 600,
    });
  });

  it("is null on the last level", () => {
    expect(nextPlayingLevel(NLPT_STANDARD_LEVELS, 18)).toBeNull();
  });
});

describe("timeToNextBreakMs", () => {
  it("adds the time left to the levels before the break", () => {
    const { clock, nowMs } = runningClock(10);
    const position = getClockPosition(clock, nowMs);
    expect(timeToNextBreakMs(NLPT_STANDARD_LEVELS, position)).toBe(70 * MINUTE);
  });

  it("counts from just after a break to the next one", () => {
    const paused = pausedClock(5, 20 * MINUTE);
    const position = getClockPosition(paused, START_MS);
    expect(timeToNextBreakMs(NLPT_STANDARD_LEVELS, position)).toBe(80 * MINUTE);
  });

  it("is null during a break", () => {
    const { clock, nowMs } = runningClock(85);
    const position = getClockPosition(clock, nowMs);
    expect(timeToNextBreakMs(NLPT_STANDARD_LEVELS, position)).toBeNull();
  });

  it("is null with no break ahead", () => {
    const paused = pausedClock(15, 20 * MINUTE);
    const position = getClockPosition(paused, START_MS);
    expect(timeToNextBreakMs(NLPT_STANDARD_LEVELS, position)).toBeNull();
  });
});

describe("serverOffsetMs", () => {
  it("assumes the server answered halfway through the round trip", () => {
    expect(
      serverOffsetMs({
        sentAtMs: 1000,
        receivedAtMs: 1200,
        serverTimeMs: 5000,
      }),
    ).toBe(3900);
  });

  it("is zero when the clocks agree", () => {
    expect(
      serverOffsetMs({
        sentAtMs: 1000,
        receivedAtMs: 1200,
        serverTimeMs: 1100,
      }),
    ).toBe(0);
  });
});
