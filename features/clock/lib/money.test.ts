import { describe, expect, it } from "vitest";
import {
  computeChips,
  computePayouts,
  computePool,
} from "@/features/clock/lib/money";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant } from "@/features/clock/types";

const NLPT_PCTS = [45, 30, 15, 10];

// count entrants, with the given rebuys spread over the first players and
// the last `busted` players out.
function entrants(count: number, rebuys = 0, busted = 0): ClockEntrant[] {
  return Array.from({ length: count }, (_, i) =>
    makeEntrant({
      rebuys: i < rebuys ? 1 : 0,
      busted_at: i >= count - busted ? "2026-11-27T20:00:00.000Z" : null,
      finish_place: i >= count - busted ? i + 1 : null,
    }),
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe("computePool", () => {
  it("adds buy-ins and rebuys", () => {
    expect(computePool(makeClock(), entrants(12, 4))).toBe(640);
  });

  it("uses the clock's own prices", () => {
    const clock = makeClock({ buy_in: 50, rebuy: 25 });
    expect(computePool(clock, entrants(10, 2))).toBe(550);
  });

  it("counts busted players and multiple rebuys", () => {
    const players = [
      makeEntrant({ rebuys: 2 }),
      makeEntrant({ busted_at: "2026-11-27T20:00:00.000Z", finish_place: 2 }),
    ];
    expect(computePool(makeClock(), players)).toBe(160);
  });

  it("is zero with no entrants", () => {
    expect(computePool(makeClock(), [])).toBe(0);
  });
});

describe("computePayouts", () => {
  it("pays each place its share of the pool", () => {
    const payouts = computePayouts(640, NLPT_PCTS, 12);
    expect(payouts).toHaveLength(4);
    [288, 192, 96, 64].forEach((expected, place) =>
      expect(payouts[place]).toBeCloseTo(expected, 6),
    );
  });

  it("scales the paid places' shares when fewer play than are paid", () => {
    const payouts = computePayouts(120, NLPT_PCTS, 3);
    expect(payouts).toHaveLength(3);
    expect(payouts[0]).toBeCloseTo(60, 6);
    expect(payouts[1]).toBeCloseTo(40, 6);
    expect(payouts[2]).toBeCloseTo(20, 6);
  });

  it("pays nothing with no entrants", () => {
    expect(computePayouts(0, NLPT_PCTS, 0)).toEqual([]);
  });

  it.each(Array.from({ length: 16 }, (_, i) => i + 1))(
    "always pays out the whole pool (%i entrants)",
    (count) => {
      const pool = computePool(makeClock(), entrants(count, 3));
      expect(sum(computePayouts(pool, NLPT_PCTS, count))).toBeCloseTo(pool, 6);
    },
  );
});

describe("computeChips", () => {
  it("counts every chip and averages over the players left", () => {
    expect(computeChips(makeClock(), entrants(10, 3, 2))).toEqual({
      totalChips: 260_000,
      playersLeft: 8,
      averageStack: 32_500,
    });
  });

  it("uses the clock's own chip counts", () => {
    const clock = makeClock({ starting_chips: 10_000, rebuy_chips: 15_000 });
    expect(computeChips(clock, entrants(4, 2)).totalChips).toBe(70_000);
  });

  it("has no average when nobody is left", () => {
    expect(computeChips(makeClock(), entrants(2, 0, 2))).toEqual({
      totalChips: 40_000,
      playersLeft: 0,
      averageStack: null,
    });
  });
});
