import { describe, expect, it } from "vitest";
import { describeLiveClock, pickLiveClock } from "@/features/clock/lib/live";
import { makeClock } from "@/features/clock/lib/test-fixtures";
import type { TournamentClock } from "@/features/clock/types";

const MINUTE = 60_000;
const SECOND = 1000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");
const FIRST_BREAK_INDEX = 4;
// Level 5 is the sixth row: four levels, then the first break.
const LEVEL_5_INDEX = 5;

function running(overrides: Partial<TournamentClock> = {}): TournamentClock {
  return makeClock({
    status: "running",
    level_started_at: new Date(START_MS).toISOString(),
    ...overrides,
  });
}

function paused(overrides: Partial<TournamentClock> = {}): TournamentClock {
  return makeClock({
    status: "paused",
    paused_remaining_ms: 5 * MINUTE,
    ...overrides,
  });
}

describe("pickLiveClock", () => {
  it("shows nothing when no clock is live", () => {
    expect(pickLiveClock([])).toBeNull();
    expect(
      pickLiveClock([
        makeClock({ status: "setup" }),
        makeClock({ status: "finished", paused_remaining_ms: 0 }),
      ]),
    ).toBeNull();
  });

  it("prefers a running clock over a newer paused one", () => {
    const older = running({ created_at: "2026-11-27T00:00:00.000Z" });
    const newer = paused({ created_at: "2026-11-28T00:00:00.000Z" });
    expect(pickLiveClock([newer, older])).toBe(older);
  });

  it("picks the newest of two running clocks", () => {
    const older = running({ created_at: "2026-11-27T00:00:00.000Z" });
    const newer = running({ created_at: "2026-11-28T00:00:00.000Z" });
    expect(pickLiveClock([older, newer])).toBe(newer);
  });

  it("shows a paused clock when it's the only one live", () => {
    const clock = paused();
    expect(pickLiveClock([makeClock(), clock])).toBe(clock);
  });
});

describe("describeLiveClock", () => {
  it("names the clock and counts down the level", () => {
    const clock = running({
      name: "Thanksgiving Showdown",
      level_index: LEVEL_5_INDEX,
    });
    const nowMs = START_MS + 7 * MINUTE + 26 * SECOND;
    expect(describeLiveClock(clock, nowMs)).toEqual({
      name: "Thanksgiving Showdown",
      detail: "Level 5",
      time: "12:34",
    });
  });

  it("says Break on a break", () => {
    const clock = running({ level_index: FIRST_BREAK_INDEX });
    expect(describeLiveClock(clock, START_MS + MINUTE)).toMatchObject({
      detail: "Break",
      time: "9:00",
    });
  });

  it("says Paused, with no countdown, while paused", () => {
    expect(describeLiveClock(paused(), START_MS)).toMatchObject({
      detail: "Paused",
      time: null,
    });
  });

  it("stays on the last level at 0:00 once the levels run out", () => {
    const clock = running();
    const dayLater = START_MS + 24 * 60 * MINUTE;
    expect(describeLiveClock(clock, dayLater)).toMatchObject({
      detail: "Level 16",
      time: "0:00",
    });
  });
});
