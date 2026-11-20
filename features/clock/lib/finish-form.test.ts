import { describe, expect, it } from "vitest";
import {
  type FinishForm,
  finishFormDefaults,
  finishFormToSave,
  validateFinishForm,
} from "@/features/clock/lib/finish-form";
import type { MemberName } from "@/features/clock/lib/players";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant } from "@/features/clock/types";
import type { Season, Week } from "@/utils/types";

// 11 players at $40, 4 paid (55/30/15 above the last place). Guests finish
// 1st and 5th; members are A (2nd), B (3rd), C (4th) and D–I (6th–11th).
const MEMBER_PLACES = [2, 3, 4, 6, 7, 8, 9, 10, 11];
const MEMBERS: MemberName[] = MEMBER_PLACES.map((place, index) => ({
  id: `m-${place}`,
  first_name: String.fromCharCode(65 + index),
  last_name: "Player",
}));

function placed(change: Partial<ClockEntrant>, place: number): ClockEntrant {
  return makeEntrant({
    busted_at: "2026-11-28T03:00:00.000Z",
    finish_place: place,
    ...change,
  });
}

const ENTRANTS: ClockEntrant[] = [
  placed({ member_id: null, guest_name: "Uncle Rob" }, 1),
  placed({ member_id: null, guest_name: "Bea" }, 5),
  ...MEMBER_PLACES.map((place) =>
    placed({ member_id: `m-${place}`, guest_name: null }, place),
  ),
];

const SEASONS: Season[] = [
  { id: "s-2025", year: 2025 },
  { id: "s-2026", year: 2026 },
];
const WEEKS: Week[] = [
  { id: "w-2026-46", week_number: 46, season_id: "s-2026" },
  { id: "w-2026-47", week_number: 47, season_id: "s-2026" },
  { id: "w-2025-52", week_number: 52, season_id: "s-2025" },
];

const CLOCK = makeClock({
  name: "Thanksgiving Showdown",
  status: "finished",
  paused_remaining_ms: 0,
  // 7:30 pm Central on Nov 27 is 01:30 UTC on Nov 28.
  created_at: "2026-11-28T01:30:00.000Z",
});

function defaults() {
  const result = finishFormDefaults({
    clock: CLOCK,
    entrants: ENTRANTS,
    members: MEMBERS,
    seasons: SEASONS,
    weeks: WEEKS,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

describe("finishFormDefaults", () => {
  it("names the tournament after the clock, on the game's day", () => {
    const { form } = defaults();
    expect(form.name).toBe("Thanksgiving Showdown");
    expect(form.date).toBe("2026-11-27");
  });

  it("picks the newest season's latest week", () => {
    const { form } = defaults();
    expect(form.season_id).toBe("s-2026");
    expect(form.week_id).toBe("w-2026-47");
  });

  it("fills in the tournament numbers, guests included", () => {
    expect(defaults().form.tournament).toEqual({
      places_paid: 4,
      buy_in_amount: 40,
      rebuy_amount: 40,
      player_count: 11,
      total_rebuys: 0,
    });
  });

  it("re-ranks members, each keeping their true place's payout", () => {
    // Pool $440: 4th gets 10% ($44); 1st–3rd split $396 as 55/30/15.
    expect(defaults().form.sessions.slice(0, 4)).toEqual([
      { member_id: "m-2", name: "A P.", rebuys: 0, cash_out: 118.8, place: 1 },
      { member_id: "m-3", name: "B P.", rebuys: 0, cash_out: 59.4, place: 2 },
      { member_id: "m-4", name: "C P.", rebuys: 0, cash_out: 44, place: 3 },
      { member_id: "m-6", name: "D P.", rebuys: 0, cash_out: 0, place: 4 },
    ]);
    expect(defaults().form.sessions).toHaveLength(9);
  });

  it("lists guests for reference, with what they won", () => {
    expect(defaults().guests).toEqual([
      { name: "Uncle Rob", place: 1, cash_out: 217.8 },
      { name: "Bea", place: 5, cash_out: 0 },
    ]);
  });

  it("refuses while anyone has no place", () => {
    const result = finishFormDefaults({
      clock: CLOCK,
      entrants: [...ENTRANTS, makeEntrant()],
      members: MEMBERS,
      seasons: SEASONS,
      weeks: WEEKS,
    });
    expect(result).toEqual({ ok: false, reason: "unplaced_entrants" });
  });

  it("leaves the week empty when there are no seasons", () => {
    const result = finishFormDefaults({
      clock: CLOCK,
      entrants: ENTRANTS,
      members: MEMBERS,
      seasons: [],
      weeks: [],
    });
    expect(
      result.ok && [result.value.form.season_id, result.value.form.week_id],
    ).toEqual(["", ""]);
  });
});

describe("validateFinishForm", () => {
  const valid = (): FinishForm => structuredClone(defaults().form);

  it("accepts the defaults", () => {
    expect(validateFinishForm(valid())).toEqual([]);
  });

  it.each<[string, (form: FinishForm) => void, string]>([
    ["a blank name", (f) => (f.name = "  "), "name"],
    ["a bad date", (f) => (f.date = "2026-13-40"), "date"],
    ["no week", (f) => (f.week_id = ""), "week_id"],
    [
      "a negative buy-in",
      (f) => (f.tournament.buy_in_amount = -1),
      "tournament",
    ],
    [
      "fractional player count",
      (f) => (f.tournament.player_count = 10.5),
      "tournament",
    ],
    ["no places paid", (f) => (f.tournament.places_paid = 0), "tournament"],
    ["a negative cash-out", (f) => (f.sessions[2].cash_out = -5), "sessions"],
    ["fractional rebuys", (f) => (f.sessions[0].rebuys = 0.5), "sessions"],
    ["no members", (f) => (f.sessions = []), "sessions"],
  ])("reports %s", (_name, change, field) => {
    const form = valid();
    change(form);
    const errors = validateFinishForm(form);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe(field);
    expect(errors[0].message).toMatch(/^[A-Z].*\.$/);
  });

  it("points at the session row with the problem", () => {
    const form = valid();
    form.sessions[2].cash_out = Number.NaN;
    expect(validateFinishForm(form)[0].index).toBe(2);
  });
});

describe("finishFormToSave", () => {
  it("builds what save_clock_results takes", () => {
    const form = defaults().form;
    form.name = "  Thanksgiving Showdown  ";
    const saved = finishFormToSave(form);
    expect(saved.tournament).toEqual({
      name: "Thanksgiving Showdown",
      date: "2026-11-27",
      week_id: "w-2026-47",
      places_paid: 4,
      buy_in_amount: 40,
      rebuy_amount: 40,
      player_count: 11,
      total_rebuys: 0,
    });
    expect(saved.sessions[0]).toEqual({
      member_id: "m-2",
      rebuys: 0,
      cash_out: 118.8,
      place: 1,
    });
  });
});
