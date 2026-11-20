import { describe, expect, it } from "vitest";
import {
  computeChips,
  computePayouts,
  computePool,
  lastPlacePct,
} from "@/features/clock/lib/money";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant } from "@/features/clock/types";

// 4 paid: 1st-3rd split the rest of the pool 55 / 30 / 15.
const NLPT_PCTS = [55, 30, 15];

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

describe("lastPlacePct", () => {
  it.each([
    [10, 10],
    [11, 10],
    [8, 13],
    [7, 15],
    [3, 34],
    [2, 50],
    [20, 5],
  ])("%i players gives %i%%", (players, pct) => {
    expect(lastPlacePct(players)).toBe(pct);
  });
});

describe("computePayouts", () => {
  function expectPayouts(actual: number[], expected: number[]): void {
    expect(actual).toHaveLength(expected.length);
    expected.forEach((amount, place) =>
      expect(actual[place]).toBeCloseTo(amount, 2),
    );
  }

  it("rounds the last place's share up to a whole percent", () => {
    // 11 players at $40: 1/11 is 9.09%, rounded up to 10% ($44 of $440).
    // 1st-3rd split the other 90% as 55 / 30 / 15.
    expectPayouts(computePayouts(440, NLPT_PCTS, 11), [217.8, 118.8, 59.4, 44]);
  });

  it("keeps the last place's share as rebuys grow the pool", () => {
    // Same 11 players, $600 after rebuys: 4th still gets 10%.
    expectPayouts(computePayouts(600, NLPT_PCTS, 11), [297, 162, 81, 60]);
  });

  it("leaves a whole-percent share as it is", () => {
    // 10 players: exactly 10%, the $40 buy-in back.
    expect(computePayouts(400, NLPT_PCTS, 10)[3]).toBeCloseTo(40, 6);
  });

  it("always gives the last place at least the buy-in back", () => {
    // 8 players at $50: 12.5% rounds up to 13%, $52 of $400.
    expect(computePayouts(400, NLPT_PCTS, 8)[3]).toBeCloseTo(52, 6);
  });

  it("pays fewer places when fewer play than are paid", () => {
    // 3 players: 33.3% rounds up to 34% for 3rd; 1st and 2nd split the
    // other 66% 55:30.
    expectPayouts(computePayouts(120, NLPT_PCTS, 3), [51.25, 27.95, 40.8]);
  });

  it("gives everything to a lone player", () => {
    expect(computePayouts(40, NLPT_PCTS, 1)).toEqual([40]);
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
