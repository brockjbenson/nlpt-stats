import { describe, expect, it } from "vitest";
import {
  type ClockControl,
  controlRefusalMessage,
  planControl,
} from "@/features/clock/lib/controls";
import { makeClock } from "@/features/clock/lib/test-fixtures";
import {
  adjustTime,
  goToLevel,
  pauseClock,
  resumeClock,
  startClock,
} from "@/features/clock/lib/timing";
import type { TournamentClock } from "@/features/clock/types";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

function running(overrides: Partial<TournamentClock> = {}): TournamentClock {
  return makeClock({
    status: "running",
    level_started_at: new Date(START_MS).toISOString(),
    ...overrides,
  });
}

const paused = makeClock({
  status: "paused",
  level_index: 2,
  paused_remaining_ms: 5 * MINUTE,
});

describe("planControl", () => {
  it("starts a clock in setup", () => {
    const clock = makeClock();
    expect(planControl(clock, { type: "start" }, START_MS)).toEqual(
      startClock(clock, START_MS),
    );
  });

  it("pauses and resumes", () => {
    const clock = running();
    const nowMs = START_MS + 5 * MINUTE;
    expect(planControl(clock, { type: "pause" }, nowMs)).toEqual(
      pauseClock(clock, nowMs),
    );
    expect(planControl(paused, { type: "resume" }, nowMs)).toEqual(
      resumeClock(paused, nowMs),
    );
  });

  it.each([
    [1, 1],
    [-1, -1],
  ] as const)("adjusts by %i minute", (minutes, sign) => {
    const clock = running();
    const nowMs = START_MS + 5 * MINUTE;
    expect(planControl(clock, { type: "adjust", minutes }, nowMs)).toEqual(
      adjustTime(clock, sign * MINUTE, nowMs),
    );
  });

  it("goes to the next level from where the clock has got to, not the saved level", () => {
    // 45 minutes in: level 3 (index 2), though index 0 is saved.
    const clock = running();
    const nowMs = START_MS + 45 * MINUTE;
    const result = planControl(clock, { type: "next" }, nowMs);
    expect(result).toEqual(goToLevel(clock, 3, nowMs));
    expect(result.ok && result.value.level_index).toBe(3);
  });

  it("goes back a level from where the clock has got to", () => {
    const clock = running();
    const nowMs = START_MS + 45 * MINUTE;
    const result = planControl(clock, { type: "previous" }, nowMs);
    expect(result.ok && result.value.level_index).toBe(1);
  });

  it("moves levels while paused", () => {
    expect(planControl(paused, { type: "next" }, START_MS)).toEqual(
      goToLevel(paused, 3, START_MS),
    );
  });

  it("refuses to go before the first level", () => {
    expect(planControl(running(), { type: "previous" }, START_MS)).toEqual({
      ok: false,
      reason: "level_out_of_range",
    });
  });

  it("refuses to go past the last level", () => {
    const last = running({ level_index: 18 });
    expect(planControl(last, { type: "next" }, START_MS)).toEqual({
      ok: false,
      reason: "level_out_of_range",
    });
  });

  it.each<ClockControl>([
    { type: "pause" },
    { type: "resume" },
    { type: "next" },
    { type: "previous" },
    { type: "adjust", minutes: 1 },
  ])("refuses $type before the clock starts", (control) => {
    expect(planControl(makeClock(), control, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });

  it("refuses to start a clock that's already running", () => {
    expect(planControl(running(), { type: "start" }, START_MS)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("controlRefusalMessage", () => {
  it("explains each refusal", () => {
    expect(controlRefusalMessage("wrong_status")).toBe(
      "The clock isn't in a state for that.",
    );
    expect(controlRefusalMessage("level_out_of_range")).toBe(
      "There's no level that way.",
    );
  });
});
