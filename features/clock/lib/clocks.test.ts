import { describe, expect, it } from "vitest";
import {
  buildClockInsert,
  clockSettingsFromStructure,
  validateClockSettings,
  type ClockSettings,
} from "@/features/clock/lib/clocks";
import { parseLevels } from "@/features/clock/lib/levels";
import {
  NAME_MAX_LENGTH,
  type StructureField,
} from "@/features/clock/lib/structures";
import { NLPT_STANDARD_LEVELS } from "@/features/clock/lib/test-fixtures";
import type {
  BlindStructure,
  BlindStructureLevel,
} from "@/features/clock/types";

const STRUCTURE: BlindStructure = {
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

// NLPT Standard's rows as stored, shuffled so order comes from position,
// with a note on the first break.
const STORED_LEVELS: BlindStructureLevel[] = NLPT_STANDARD_LEVELS.map(
  (level, index) => ({
    ...level,
    ...(index === 4 && { note: "Color up the 25s" }),
    id: `level-${index}`,
    structure_id: STRUCTURE.id,
    position: index + 1,
  }),
).reverse();

function validSettings(change: Partial<ClockSettings> = {}): ClockSettings {
  return { ...clockSettingsFromStructure(STRUCTURE, "Nov 27"), ...change };
}

describe("clockSettingsFromStructure", () => {
  it("copies the template's defaults and names the clock by date", () => {
    expect(clockSettingsFromStructure(STRUCTURE, "Nov 27")).toEqual({
      name: "NLPT Standard – Nov 27",
      buy_in: 40,
      rebuy: 40,
      starting_chips: 20000,
      rebuy_chips: 20000,
      places_paid: 4,
      payout_pcts: [55, 30, 15],
      max_rebuys: 2,
    });
  });

  it("doesn't share the template's payout array", () => {
    const settings = clockSettingsFromStructure(STRUCTURE, "Nov 27");
    expect(settings.payout_pcts).not.toBe(STRUCTURE.default_payout_pcts);
  });

  it("keeps the name within the length limit", () => {
    const longName = { ...STRUCTURE, name: "x".repeat(NAME_MAX_LENGTH) };
    const { name } = clockSettingsFromStructure(longName, "Nov 27");
    expect(name.length).toBeLessThanOrEqual(NAME_MAX_LENGTH);
    expect(name.endsWith(" – Nov 27")).toBe(true);
  });
});

describe("buildClockInsert", () => {
  const insert = buildClockInsert(STRUCTURE, STORED_LEVELS, validSettings());

  it("snapshots the levels in position order, keeping break notes", () => {
    expect(insert.levels).toHaveLength(19);
    expect(insert.levels[0]).toEqual(NLPT_STANDARD_LEVELS[0]);
    expect(insert.levels[4].note).toBe("Color up the 25s");
    expect(insert.levels[18]).toEqual(NLPT_STANDARD_LEVELS[18]);
  });

  it("leaves template-only keys out of the snapshot", () => {
    for (const level of insert.levels) {
      expect(level).not.toHaveProperty("id");
      expect(level).not.toHaveProperty("structure_id");
      expect(level).not.toHaveProperty("position");
    }
  });

  it("only adds a note where there is one", () => {
    expect(insert.levels[0]).not.toHaveProperty("note");
    expect(insert.levels[9]).not.toHaveProperty("note");
  });

  it("gives levels the clock's level rules accept", () => {
    expect(parseLevels(structuredClone(insert.levels))).toEqual(insert.levels);
  });

  it("starts in setup on the first level with no times", () => {
    expect(insert).toMatchObject({
      status: "setup",
      level_index: 0,
      level_started_at: null,
      paused_remaining_ms: null,
      structure_id: STRUCTURE.id,
      tournament_id: null,
    });
  });

  it("uses the settings, trimming the name", () => {
    const custom = buildClockInsert(
      STRUCTURE,
      STORED_LEVELS,
      validSettings({ name: "  Friday Game  ", buy_in: 50, max_rebuys: 1 }),
    );
    expect(custom).toMatchObject({
      name: "Friday Game",
      buy_in: 50,
      max_rebuys: 1,
    });
  });
});

type SettingsCase = [string, Partial<ClockSettings>, StructureField, string];

describe("validateClockSettings", () => {
  it("accepts the template's defaults", () => {
    expect(validateClockSettings(validSettings())).toEqual([]);
  });

  it.each<SettingsCase>([
    ["a blank name", { name: "  " }, "name", "Give the clock a name."],
    ["a negative buy-in", { buy_in: -1 }, "money", "Buy-in and rebuy"],
    ["zero starting chips", { starting_chips: 0 }, "chips", "Chip counts"],
    [
      "only 2 places paid",
      { places_paid: 2, payout_pcts: [100] },
      "places_paid",
      "Pay at least 3 places",
    ],
    [
      "a split that adds up to 95",
      { payout_pcts: [50, 30, 15] },
      "payout_pcts",
      "add up to 95%",
    ],
    ["fractional max rebuys", { max_rebuys: 1.5 }, "max_rebuys", "Max rebuys"],
  ])("reports %s", (_name, change, field, message) => {
    const errors = validateClockSettings(validSettings(change));
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe(field);
    expect(errors[0].message).toContain(message);
  });
});
