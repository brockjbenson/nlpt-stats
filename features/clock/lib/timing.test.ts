import { describe, expect, it } from "vitest";
import { getClockPosition } from "@/features/clock/lib/timing";
import { makeClock } from "@/features/clock/lib/test-fixtures";

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
