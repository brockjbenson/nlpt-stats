import { describe, expect, it } from "vitest";
import { formatBlinds, formatClockTime } from "@/features/clock/lib/format";
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
    expect(formatBlinds(NLPT_STANDARD_LEVELS[8])).toBe("1,000 / 2,000");
  });

  it("shows small blinds as they are", () => {
    expect(formatBlinds(NLPT_STANDARD_LEVELS[0])).toBe("100 / 200");
  });

  it("adds the ante only when there is one", () => {
    expect(formatBlinds({ ...NLPT_STANDARD_LEVELS[8], ante: 200 })).toBe(
      "1,000 / 2,000 (ante 200)",
    );
  });

  it("names a break", () => {
    expect(formatBlinds(NLPT_STANDARD_LEVELS[4])).toBe("Break");
  });
});
