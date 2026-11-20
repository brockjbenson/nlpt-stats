import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/dates";

// Run as if in the league's time zone, where a date read as UTC midnight
// shows as the evening before.
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Chicago";
});
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe("parseDateOnly", () => {
  it("reads a yyyy-mm-dd date as that day, not the evening before", () => {
    const date = parseDateOnly("2026-11-27");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 10, 27,
    ]);
    expect(date.getHours()).toBe(0);
  });

  it("reads a yyyy-mm month as its first day", () => {
    const date = parseDateOnly("2025-01");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2025, 0, 1,
    ]);
  });

  it("shows the right day when formatted", () => {
    expect(
      parseDateOnly("2026-01-01").toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      }),
    ).toBe("1/1/26");
  });

  it("leaves a full timestamp to the usual parsing", () => {
    const stamp = "2026-11-28T01:30:00.000Z";
    expect(parseDateOnly(stamp).getTime()).toBe(Date.parse(stamp));
  });
});
