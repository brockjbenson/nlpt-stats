import { describe, expect, it } from "vitest";
import {
  formatBlinds,
  formatChips,
  formatClockTime,
  formatDollars,
  formatDuration,
  formatElapsed,
  ordinal,
  plural,
} from "@/features/clock/lib/format";
import { NLPT_STANDARD_LEVELS } from "@/features/clock/lib/test-fixtures";

describe("formatClockTime", () => {
  it.each([
    [0, "0:00"],
    [1, "0:01"],
    [999, "0:01"],
    [1000, "0:01"],
    [59_001, "1:00"],
    [65_000, "1:05"],
    [1_200_000, "20:00"],
    [3_599_000, "59:59"],
    [3_600_000, "1:00:00"],
    [3_661_000, "1:01:01"],
    [-5000, "0:00"],
  ])("%i ms shows %s", (ms, expected) => {
    expect(formatClockTime(ms)).toBe(expected);
  });
});

describe("formatBlinds", () => {
  it("separates thousands", () => {
    expect(formatBlinds(NLPT_STANDARD_LEVELS[10])).toBe("1,000 / 2,000");
  });

  it("shows small blinds as they are", () => {
    expect(formatBlinds(NLPT_STANDARD_LEVELS[0])).toBe("100 / 200");
  });

  it("adds the ante only when there is one", () => {
    expect(formatBlinds({ ...NLPT_STANDARD_LEVELS[10], ante: 200 })).toBe(
      "1,000 / 2,000 (ante 200)",
    );
  });

  it("names a break", () => {
    expect(formatBlinds(NLPT_STANDARD_LEVELS[4])).toBe("Break");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [20 * 60_000, "20m"],
    [60 * 60_000, "1h"],
    [350 * 60_000, "5h 50m"],
    [90_000, "2m"],
  ])("%i ms reads %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe("formatDollars", () => {
  it.each([
    [40, "$40"],
    [1500, "$1,500"],
    [12.5, "$12.50"],
    [0, "$0"],
  ])("%d reads %s", (amount, expected) => {
    expect(formatDollars(amount)).toBe(expected);
  });
});

describe("formatChips", () => {
  it("separates thousands", () => {
    expect(formatChips(20000)).toBe("20,000");
  });
});

describe("ordinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [103, "103rd"],
  ])("%i is %s", (place, expected) => {
    expect(ordinal(place)).toBe(expected);
  });
});

describe("formatElapsed", () => {
  it.each([
    [0, "0:00"],
    [20 * 60_000, "0:20"],
    [80 * 60_000, "1:20"],
    [330 * 60_000, "5:30"],
    [90_000, "0:01"],
  ])("%i ms reads %s", (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });
});

describe("plural", () => {
  it.each([
    [0, "0 levels"],
    [1, "1 level"],
    [16, "16 levels"],
  ])("%i reads %s", (count, expected) => {
    expect(plural(count, "level")).toBe(expected);
  });
});
