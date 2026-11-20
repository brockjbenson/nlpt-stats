import { describe, expect, it } from "vitest";
import {
  copyName,
  draftToSaveInput,
  hasUnsavedChanges,
  isCompleteSplit,
  levelStartTimes,
  NAME_MAX_LENGTH,
  newStructureDraft,
  payoutTotal,
  type StructureDraft,
  type StructureField,
  structureToDraft,
  summarizeLevels,
  SUGGESTED_SPLITS,
  validateStructureDraft,
} from "@/features/clock/lib/structures";
import { NLPT_STANDARD_LEVELS } from "@/features/clock/lib/test-fixtures";
import type {
  BlindStructure,
  BlindStructureLevel,
} from "@/features/clock/types";

const NLPT_STANDARD: BlindStructure = {
  id: "structure-1",
  name: "NLPT Standard",
  default_buy_in: 40,
  default_rebuy: 40,
  default_starting_chips: 20000,
  default_rebuy_chips: 20000,
  default_places_paid: 4,
  default_payout_pcts: [55, 30, 15],
  default_max_rebuys: 2,
  created_at: "2026-11-19T00:00:00.000Z",
};

// Stored rows, deliberately out of order to check sorting.
const NLPT_ROWS: BlindStructureLevel[] = NLPT_STANDARD_LEVELS.map(
  (level, index) => ({
    ...level,
    id: `level-${index + 1}`,
    structure_id: NLPT_STANDARD.id,
    position: index + 1,
  }),
).reverse();

function draft(overrides: Partial<StructureDraft> = {}): StructureDraft {
  return { ...structureToDraft(NLPT_STANDARD, NLPT_ROWS), ...overrides };
}

function withLevel(index: number, change: object): StructureDraft {
  const base = draft();
  return {
    ...base,
    levels: base.levels.map((level, i) =>
      i === index ? { ...level, ...change } : level,
    ),
  };
}

function fields(value: StructureDraft): string[] {
  return validateStructureDraft(value).map(({ field }) => field);
}

describe("newStructureDraft", () => {
  it("starts with the league defaults and one level", () => {
    const fresh = newStructureDraft();
    expect(fresh).toMatchObject({
      name: "",
      buy_in: 40,
      rebuy: 40,
      starting_chips: 20000,
      rebuy_chips: 20000,
      places_paid: 4,
      payout_pcts: [55, 30, 15],
      max_rebuys: 2,
    });
    expect(fresh.levels).toHaveLength(1);
    expect(fresh.levels[0]).toMatchObject({
      kind: "level",
      small_blind: 100,
      big_blind: 200,
      duration_seconds: 1200,
    });
  });

  it("is valid once it has a name", () => {
    expect(
      validateStructureDraft({ ...newStructureDraft(), name: "Turbo" }),
    ).toEqual([]);
  });
});

describe("new_level_seconds", () => {
  it("starts at 20 minutes for a new template", () => {
    expect(newStructureDraft().new_level_seconds).toBe(20 * 60);
  });

  it("starts at the template's most common level length", () => {
    const rows: BlindStructureLevel[] = [15, 15, 20, 15].map(
      (minutes, index) => ({
        id: `l${index}`,
        structure_id: NLPT_STANDARD.id,
        position: index + 1,
        kind: "level",
        small_blind: 100,
        big_blind: 200,
        ante: 0,
        duration_seconds: minutes * 60,
      }),
    );
    expect(structureToDraft(NLPT_STANDARD, rows).new_level_seconds).toBe(
      15 * 60,
    );
  });

  it("isn't saved", () => {
    const input = draftToSaveInput({ ...draft(), new_level_seconds: 300 });
    expect(JSON.stringify(input)).not.toContain("new_level");
  });
});

describe("new_break_seconds", () => {
  it("starts at 10 minutes for a new template", () => {
    expect(newStructureDraft().new_break_seconds).toBe(10 * 60);
  });

  it("starts at the template's most common break length", () => {
    const rows: BlindStructureLevel[] = [
      { kind: "level" as const, minutes: 20 },
      { kind: "break" as const, minutes: 15 },
      { kind: "level" as const, minutes: 20 },
      { kind: "break" as const, minutes: 15 },
      { kind: "break" as const, minutes: 5 },
    ].map(({ kind, minutes }, index) => ({
      id: `l${index}`,
      structure_id: NLPT_STANDARD.id,
      position: index + 1,
      kind,
      small_blind: kind === "level" ? 100 : null,
      big_blind: kind === "level" ? 200 : null,
      ante: 0,
      duration_seconds: minutes * 60,
    }));
    const value = structureToDraft(NLPT_STANDARD, rows);
    expect(value.new_break_seconds).toBe(15 * 60);
    expect(value.new_level_seconds).toBe(20 * 60);
  });

  it("is ignored by unsaved changes", () => {
    expect(
      hasUnsavedChanges(draft(), { ...draft(), new_break_seconds: 300 }),
    ).toBe(false);
  });
});

describe("hasUnsavedChanges", () => {
  it("is false for the same template", () => {
    expect(hasUnsavedChanges(draft(), draft())).toBe(false);
  });

  it("ignores the new level length", () => {
    expect(
      hasUnsavedChanges(draft(), { ...draft(), new_level_seconds: 300 }),
    ).toBe(false);
  });

  it("is true when something saved changes", () => {
    expect(hasUnsavedChanges(draft(), { ...draft(), buy_in: 50 })).toBe(true);
  });

  it("ignores row keys", () => {
    const rekeyed = draft();
    rekeyed.levels = rekeyed.levels.map((level, index) => ({
      ...level,
      key: `other-${index}`,
    }));
    expect(hasUnsavedChanges(draft(), rekeyed)).toBe(false);
  });
});

describe("structureToDraft and draftToSaveInput", () => {
  it("sorts levels by position and keys them by id", () => {
    const value = draft();
    expect(value.levels.map(({ key }) => key)).toEqual(
      NLPT_STANDARD_LEVELS.map((_, index) => `level-${index + 1}`),
    );
  });

  it("round-trips NLPT Standard", () => {
    expect(draftToSaveInput(draft())).toEqual({
      structure: {
        name: "NLPT Standard",
        default_buy_in: 40,
        default_rebuy: 40,
        default_starting_chips: 20000,
        default_rebuy_chips: 20000,
        default_places_paid: 4,
        default_payout_pcts: [55, 30, 15],
        default_max_rebuys: 2,
      },
      levels: NLPT_STANDARD_LEVELS,
    });
  });

  it("trims the name", () => {
    expect(draftToSaveInput(draft({ name: "  Turbo  " })).structure.name).toBe(
      "Turbo",
    );
  });

  it("doesn't share arrays with the stored template", () => {
    const value = draft();
    value.payout_pcts[0] = 99;
    expect(NLPT_STANDARD.default_payout_pcts[0]).toBe(55);
  });
});

describe("break notes", () => {
  it("round-trips a trimmed break note", () => {
    const withNote = withLevel(4, { note: "  Color up the 25s " });
    expect(draftToSaveInput(withNote).levels[4].note).toBe("Color up the 25s");
  });

  it("saves a blank note as none", () => {
    expect(
      draftToSaveInput(withLevel(4, { note: "   " })).levels[4].note,
    ).toBeUndefined();
  });

  it("loads a stored note", () => {
    const rows = NLPT_ROWS.map((row) =>
      row.position === 5 ? { ...row, note: "Dinner" } : row,
    );
    expect(structureToDraft(NLPT_STANDARD, rows).levels[4].note).toBe("Dinner");
  });

  it("rejects a note over 100 characters", () => {
    expect(
      validateStructureDraft(withLevel(4, { note: "x".repeat(101) })),
    ).toEqual([expect.objectContaining({ field: "levels", levelIndex: 4 })]);
  });
});

describe("validateStructureDraft", () => {
  it("accepts NLPT Standard", () => {
    expect(validateStructureDraft(draft())).toEqual([]);
  });

  it.each<[string, Partial<StructureDraft>, StructureField]>([
    ["a blank name", { name: "   " }, "name"],
    ["a name over 60 characters", { name: "x".repeat(61) }, "name"],
    ["a negative buy-in", { buy_in: -1 }, "money"],
    ["a rebuy that isn't a number", { rebuy: Number.NaN }, "money"],
    ["zero starting chips", { starting_chips: 0 }, "chips"],
    ["fractional rebuy chips", { rebuy_chips: 1.5 }, "chips"],
    ["2 places paid", { places_paid: 2, payout_pcts: [60, 40] }, "places_paid"],
    ["a fractional rebuy limit", { max_rebuys: 1.5 }, "max_rebuys"],
    ["a negative rebuy limit", { max_rebuys: -1 }, "max_rebuys"],
  ])("rejects %s", (_name, change, field) => {
    expect(fields(draft(change))).toEqual([field]);
  });

  it.each([
    ["too few percentages", [55, 45]],
    ["one for the last place too", [45, 30, 15, 10]],
    ["percentages adding to 95", [55, 30, 10]],
    ["a zero percentage", [55, 45, 0]],
  ])("rejects %s", (_name, payout_pcts) => {
    expect(fields(draft({ payout_pcts }))).toEqual(["payout_pcts"]);
  });

  it("accepts percentages that add to 100 with decimals", () => {
    expect(
      fields(draft({ places_paid: 4, payout_pcts: [33.3, 33.3, 33.4] })),
    ).toEqual([]);
  });

  it("names the level that breaks a rule", () => {
    expect(validateStructureDraft(withLevel(2, { big_blind: 50 }))).toEqual([
      expect.objectContaining({ field: "levels", levelIndex: 2 }),
    ]);
  });

  it("rejects a break with blinds", () => {
    expect(
      validateStructureDraft(
        withLevel(4, { small_blind: 100, big_blind: 200 }),
      ),
    ).toEqual([expect.objectContaining({ field: "levels", levelIndex: 4 })]);
  });

  it("needs at least one playing level", () => {
    const breaksOnly = draft({
      levels: [{ ...NLPT_STANDARD_LEVELS[4], key: "break" }],
    });
    expect(validateStructureDraft(breaksOnly)).toEqual([
      expect.objectContaining({ field: "levels" }),
    ]);
    expect(validateStructureDraft(breaksOnly)[0].levelIndex).toBeUndefined();
  });

  it("reports every problem at once", () => {
    expect(fields(draft({ name: "", buy_in: -1, max_rebuys: -1 }))).toEqual([
      "name",
      "money",
      "max_rebuys",
    ]);
  });
});

describe("SUGGESTED_SPLITS", () => {
  it.each(Object.entries(SUGGESTED_SPLITS))(
    "the %s-place split has a share for each place above the last, adding to 100",
    (places, split) => {
      expect(split).toHaveLength(Number(places) - 1);
      expect(split.reduce((total, pct) => total + pct, 0)).toBe(100);
    },
  );
});

describe("summarizeLevels", () => {
  it("counts levels, breaks and length", () => {
    expect(summarizeLevels(NLPT_STANDARD_LEVELS)).toEqual({
      levelCount: 16,
      breakCount: 3,
      lengthMs: (5 * 60 + 50) * 60 * 1000,
    });
  });
});

describe("copyName", () => {
  it("prefixes the name", () => {
    expect(copyName("NLPT Standard", ["NLPT Standard"])).toBe(
      "Copy of NLPT Standard",
    );
  });

  it("numbers further copies", () => {
    expect(
      copyName("NLPT Standard", [
        "NLPT Standard",
        "Copy of NLPT Standard",
        "Copy 2 of NLPT Standard",
      ]),
    ).toBe("Copy 3 of NLPT Standard");
  });

  it("stays within the name length limit", () => {
    const long = "x".repeat(NAME_MAX_LENGTH);
    const name = copyName(long, [long]);
    expect(name.length).toBe(NAME_MAX_LENGTH);
    expect(name.startsWith("Copy of x")).toBe(true);
  });
});

describe("levelStartTimes", () => {
  it("gives each row the time it starts", () => {
    const starts = levelStartTimes(NLPT_STANDARD_LEVELS);
    const minutes = starts.map((ms) => ms / 60_000);
    expect(minutes.slice(0, 7)).toEqual([0, 20, 40, 60, 80, 90, 110]);
    expect(minutes[18]).toBe(330);
  });

  it("is empty with no rows", () => {
    expect(levelStartTimes([])).toEqual([]);
  });
});

describe("payoutTotal and isCompleteSplit", () => {
  it("adds the percentages, counting an empty box as 0", () => {
    expect(payoutTotal([55, Number.NaN, 15])).toBe(70);
  });

  it("accepts 100 with hand-typed decimals", () => {
    expect(isCompleteSplit([33.3, 33.3, 33.4])).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isCompleteSplit([55, 30, 10])).toBe(false);
  });
});
