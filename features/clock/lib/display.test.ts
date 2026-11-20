import { describe, expect, it } from "vitest";
import { describeClock, describeField } from "@/features/clock/lib/display";
import {
  makeClock,
  makeEntrant,
  NLPT_STANDARD_LEVELS,
} from "@/features/clock/lib/test-fixtures";
import type {
  BlindLevel,
  ClockEntrant,
  TournamentClock,
} from "@/features/clock/types";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");
const FIRST_BREAK_INDEX = 4;
const LAST_INDEX = NLPT_STANDARD_LEVELS.length - 1;

function running(overrides: Partial<TournamentClock> = {}): TournamentClock {
  return makeClock({
    status: "running",
    level_started_at: new Date(START_MS).toISOString(),
    ...overrides,
  });
}

describe("describeClock", () => {
  it("shows level 1 with its full time before the clock starts", () => {
    const view = describeClock(makeClock(), START_MS);
    expect(view).toMatchObject({
      status: "setup",
      title: "Level 1",
      isBreak: false,
      note: null,
      blinds: "100 / 200",
      ante: null,
      next: { blinds: "150 / 300", ante: null },
      nextBreakMs: 80 * MINUTE,
      timeText: "20:00",
      progress: 0,
      isFinalLevel: false,
      isOutOfTime: false,
    });
    expect(view.position.levelIndex).toBe(0);
  });

  it("catches up to level 2 when 25 minutes have passed", () => {
    const view = describeClock(running(), START_MS + 25 * MINUTE);
    expect(view).toMatchObject({
      title: "Level 2",
      blinds: "150 / 300",
      timeText: "15:00",
      progress: 0.25,
    });
  });

  it("shows the ante on its own when the level has one", () => {
    const levels: BlindLevel[] = NLPT_STANDARD_LEVELS.map((level, index) =>
      index === 0 ? { ...level, ante: 200 } : level,
    );
    const view = describeClock(makeClock({ levels }), START_MS);
    expect(view.blinds).toBe("100 / 200");
    expect(view.ante).toBe("200");
  });

  it("shows the next level's ante", () => {
    const levels: BlindLevel[] = NLPT_STANDARD_LEVELS.map((level, index) =>
      index === 1 ? { ...level, ante: 300 } : level,
    );
    const view = describeClock(makeClock({ levels }), START_MS);
    expect(view.next).toEqual({ blinds: "150 / 300", ante: "300" });
  });

  it("shows a break's note and the blinds after it", () => {
    const levels: BlindLevel[] = NLPT_STANDARD_LEVELS.map((level, index) =>
      index === FIRST_BREAK_INDEX
        ? { ...level, note: "Color up the 25s" }
        : level,
    );
    const view = describeClock(
      running({ levels, level_index: FIRST_BREAK_INDEX }),
      START_MS + 3 * MINUTE,
    );
    expect(view).toMatchObject({
      title: "Break",
      isBreak: true,
      note: "Color up the 25s",
      blinds: null,
      ante: null,
      next: { blinds: "300 / 600", ante: null },
      nextBreakMs: null,
      timeText: "7:00",
    });
  });

  it("has no note on a break without one", () => {
    const view = describeClock(
      running({ level_index: FIRST_BREAK_INDEX }),
      START_MS,
    );
    expect(view.title).toBe("Break");
    expect(view.note).toBeNull();
  });

  it("holds the time while paused, however long it stays paused", () => {
    const clock = makeClock({
      status: "paused",
      level_index: 2,
      paused_remaining_ms: 90_000,
    });
    const soon = describeClock(clock, START_MS);
    const later = describeClock(clock, START_MS + 60 * MINUTE);
    expect(soon.timeText).toBe("1:30");
    expect(later.timeText).toBe("1:30");
    expect(later.title).toBe("Level 3");
    expect(later.progress).toBeCloseTo(1 - 90 / 1200);
  });

  it("stays at 0:00 on the last level once its time is up", () => {
    const view = describeClock(
      running({ level_index: LAST_INDEX }),
      START_MS + 45 * MINUTE,
    );
    expect(view).toMatchObject({
      title: "Level 16",
      blinds: "7,500 / 15,000",
      next: null,
      nextBreakMs: null,
      timeText: "0:00",
      progress: 1,
      isFinalLevel: true,
      isOutOfTime: true,
    });
  });

  it("isn't out of time on the last level while time is left", () => {
    const view = describeClock(
      running({ level_index: LAST_INDEX }),
      START_MS + 5 * MINUTE,
    );
    expect(view.isFinalLevel).toBe(true);
    expect(view.isOutOfTime).toBe(false);
  });

  it("isn't out of time when a paused last level is at 0:00", () => {
    const view = describeClock(
      makeClock({
        status: "paused",
        level_index: LAST_INDEX,
        paused_remaining_ms: 0,
      }),
      START_MS,
    );
    expect(view.timeText).toBe("0:00");
    expect(view.isOutOfTime).toBe(false);
  });

  it("counts time added past the level's length as no progress", () => {
    const view = describeClock(
      makeClock({
        status: "paused",
        level_index: 0,
        paused_remaining_ms: 25 * MINUTE,
      }),
      START_MS,
    );
    expect(view.timeText).toBe("25:00");
    expect(view.progress).toBe(0);
  });

  it("shows where a finished clock stopped", () => {
    const view = describeClock(
      makeClock({
        status: "finished",
        level_index: 6,
        paused_remaining_ms: 4 * MINUTE,
      }),
      START_MS + 90 * MINUTE,
    );
    expect(view).toMatchObject({
      status: "finished",
      title: "Level 6",
      timeText: "4:00",
    });
  });
});

// count players; the first `out` have busted, and rebuys are spread one
// each over the first `rebuys` players.
function field({
  count,
  out = 0,
  rebuys = 0,
}: {
  count: number;
  out?: number;
  rebuys?: number;
}): ClockEntrant[] {
  return Array.from({ length: count }, (_, index) =>
    makeEntrant({
      rebuys: index < rebuys ? 1 : 0,
      ...(index < out && {
        busted_at: "2026-11-27T20:00:00.000Z",
        finish_place: count - index,
      }),
    }),
  );
}

describe("describeField", () => {
  const clock = makeClock();

  it("pays the design's example: 11 players, no rebuys", () => {
    const view = describeField(clock, field({ count: 11 }));
    expect(view.poolText).toBe("$440");
    expect(view.payouts).toEqual([
      { place: 1, label: "1st", amountText: "$217.80" },
      { place: 2, label: "2nd", amountText: "$118.80" },
      { place: 3, label: "3rd", amountText: "$59.40" },
      { place: 4, label: "4th", amountText: "$44" },
    ]);
  });

  it("grows every payout with rebuys", () => {
    // 11 × $40 + 4 rebuys × $40 = $600.
    const view = describeField(clock, field({ count: 11, rebuys: 4 }));
    expect(view.pool).toBe(600);
    expect(view.payouts.map(({ amountText }) => amountText)).toEqual([
      "$297",
      "$162",
      "$81",
      "$60",
    ]);
  });

  it("pays only as many places as there are players", () => {
    const view = describeField(clock, field({ count: 3 }));
    expect(view.payouts.map(({ label }) => label)).toEqual([
      "1st",
      "2nd",
      "3rd",
    ]);
  });

  it("counts players and works out the average stack", () => {
    // (10 × 20,000 + 2 × 20,000) chips over 6 players left.
    const view = describeField(clock, field({ count: 10, out: 4, rebuys: 2 }));
    expect(view).toMatchObject({
      playersLeft: 6,
      entrantCount: 10,
      avgStackText: "40,000",
    });
  });

  it("rounds the average stack to a whole chip", () => {
    // 7 × 20,000 chips over 3 players left.
    const view = describeField(clock, field({ count: 7, out: 4 }));
    expect(view.avgStackText).toBe("46,667");
  });

  it("is empty with no players", () => {
    expect(describeField(clock, [])).toEqual({
      playersLeft: 0,
      entrantCount: 0,
      pool: 0,
      poolText: "$0",
      avgStackText: null,
      payouts: [],
    });
  });
});
