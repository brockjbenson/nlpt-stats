import { describe, expect, it } from "vitest";
import { computePool } from "@/features/clock/lib/money";
import { buildFinishResults } from "@/features/clock/lib/results";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant } from "@/features/clock/types";

const BUSTED_AT = "2026-11-27T22:00:00.000Z";
const clock = makeClock({ status: "finished" });

function member(id: string, place: number, rebuys = 0): ClockEntrant {
  return makeEntrant({
    member_id: id,
    guest_name: null,
    rebuys,
    busted_at: place === 1 ? null : BUSTED_AT,
    finish_place: place,
  });
}

function guest(place: number, rebuys = 0): ClockEntrant {
  return makeEntrant({
    rebuys,
    busted_at: place === 1 ? null : BUSTED_AT,
    finish_place: place,
  });
}

// 6 players, 2 guests, 3 rebuys: pool $360. 4th gets 1/6 rounded up to
// 17% ($61.20); 1st-3rd split the other $298.80 as 164.34 / 89.64 / 44.82.
const field = [
  guest(1, 1),
  member("ana", 2),
  member("ben", 3, 1),
  guest(4),
  member("cal", 5, 1),
  member("dee", 6),
];

function build(entrants: ClockEntrant[]) {
  const result = buildFinishResults(clock, entrants);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.value;
}

describe("buildFinishResults", () => {
  it("re-ranks members, keeping the payout of their true place", () => {
    const { sessions } = build(field);
    expect(sessions.map(({ member_id, place }) => [member_id, place])).toEqual([
      ["ana", 1],
      ["ben", 2],
      ["cal", 3],
      ["dee", 4],
    ]);
    expect(sessions[0].cash_out).toBeCloseTo(89.64, 6);
    expect(sessions[1].cash_out).toBeCloseTo(44.82, 6);
  });

  it("pays nothing out of the money", () => {
    const { sessions } = build(field);
    expect(sessions[2].cash_out).toBe(0);
    expect(sessions[3].cash_out).toBe(0);
  });

  it("keeps each member's rebuys", () => {
    const { sessions } = build(field);
    expect(sessions.map(({ rebuys }) => rebuys)).toEqual([0, 1, 1, 0]);
  });

  it("totals the tournament with guests included", () => {
    expect(build(field).tournament).toEqual({
      places_paid: 4,
      buy_in_amount: 40,
      rebuy_amount: 40,
      player_count: 6,
      total_rebuys: 3,
    });
  });

  it("pays out the whole pool between members and guests", () => {
    const { sessions } = build(field);
    const guestPayouts = 164.34 + 61.2;
    const memberPayouts = sessions.reduce((total, s) => total + s.cash_out, 0);
    expect(memberPayouts + guestPayouts).toBeCloseTo(
      computePool(clock, field),
      6,
    );
  });

  it("saves the places actually paid when fewer play than are paid", () => {
    const small = [member("ana", 1), member("ben", 2), member("cal", 3)];
    const { tournament, sessions } = build(small);
    expect(tournament.places_paid).toBe(3);
    expect(sessions.every(({ cash_out }) => cash_out > 0)).toBe(true);
  });

  it("works with members only", () => {
    const members = [member("ana", 2), member("ben", 1)];
    expect(build(members).sessions.map(({ member_id }) => member_id)).toEqual([
      "ben",
      "ana",
    ]);
  });

  it("refuses while someone has no place", () => {
    const unplaced = [
      ...field,
      makeEntrant({ member_id: "eve", guest_name: null }),
    ];
    expect(buildFinishResults(clock, unplaced)).toEqual({
      ok: false,
      reason: "unplaced_entrants",
    });
  });

  it("refuses with no entrants", () => {
    expect(buildFinishResults(clock, [])).toEqual({
      ok: false,
      reason: "no_entrants",
    });
  });
});
