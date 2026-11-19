import { describe, expect, it } from "vitest";
import {
  levelDurationMs,
  levelNumber,
  parseLevels,
  scheduleLengthMs,
} from "@/features/clock/lib/levels";
import { NLPT_STANDARD_LEVELS } from "@/features/clock/lib/test-fixtures";

const FIVE_HOURS_FIFTY_MINUTES_MS = (5 * 60 + 50) * 60 * 1000;

function withLevel(index: number, change: Record<string, unknown>): unknown {
  return NLPT_STANDARD_LEVELS.map((level, i) =>
    i === index ? { ...level, ...change } : level,
  );
}

describe("parseLevels", () => {
  it("accepts NLPT Standard unchanged", () => {
    expect(parseLevels(structuredClone(NLPT_STANDARD_LEVELS))).toEqual(
      NLPT_STANDARD_LEVELS,
    );
  });

  it.each([
    ["not an array", { kind: "level" }],
    ["an empty array", []],
    ["a row that isn't an object", [null]],
  ])("rejects %s", (_name, value) => {
    expect(() => parseLevels(value)).toThrow();
  });

  it.each([
    ["an unknown kind", { kind: "pause" }],
    ["a zero duration", { duration_seconds: 0 }],
    ["a fractional duration", { duration_seconds: 1.5 }],
    ["a missing duration", { duration_seconds: undefined }],
    ["a negative ante", { ante: -1 }],
    ["a zero small blind", { small_blind: 0 }],
    ["a big blind below the small blind", { big_blind: 50 }],
    ["missing blinds", { small_blind: null, big_blind: null }],
  ])("rejects a level with %s and names its index", (_name, change) => {
    expect(() => parseLevels(withLevel(2, change))).toThrow(/index 2/);
  });

  it("rejects a break with blinds", () => {
    expect(() =>
      parseLevels(withLevel(4, { small_blind: 100, big_blind: 200 })),
    ).toThrow(/index 4/);
  });
});

describe("levelDurationMs", () => {
  it("converts seconds to milliseconds", () => {
    expect(levelDurationMs(NLPT_STANDARD_LEVELS[0])).toBe(1_200_000);
    expect(levelDurationMs(NLPT_STANDARD_LEVELS[4])).toBe(600_000);
  });
});

describe("scheduleLengthMs", () => {
  it("adds every level and break", () => {
    expect(scheduleLengthMs(NLPT_STANDARD_LEVELS)).toBe(
      FIVE_HOURS_FIFTY_MINUTES_MS,
    );
  });
});

describe("levelNumber", () => {
  it.each([
    [0, 1],
    [3, 4],
    [4, null],
    [5, 5],
    [18, 16],
  ])("index %i is level %s", (index, expected) => {
    expect(levelNumber(NLPT_STANDARD_LEVELS, index)).toBe(expected);
  });

  it("is null outside the schedule", () => {
    expect(levelNumber(NLPT_STANDARD_LEVELS, 19)).toBeNull();
    expect(levelNumber(NLPT_STANDARD_LEVELS, -1)).toBeNull();
  });
});
