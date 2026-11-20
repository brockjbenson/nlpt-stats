import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ClockRow,
  getClock,
  getLiveClocks,
  mergeClockRow,
  toClock,
} from "@/features/clock/data/clocks";
import {
  makeClock,
  NLPT_STANDARD_LEVELS,
} from "@/features/clock/lib/test-fixtures";

function rowFrom(overrides: Partial<ClockRow> = {}): ClockRow {
  return { ...makeClock(), ...overrides };
}

describe("toClock", () => {
  it("turns numeric columns sent as text into numbers", () => {
    const clock = toClock(
      rowFrom({ buy_in: "40", rebuy: "40.5", payout_pcts: ["55", 30, "15"] }),
    );
    expect(clock.buy_in).toBe(40);
    expect(clock.rebuy).toBe(40.5);
    expect(clock.payout_pcts).toEqual([55, 30, 15]);
  });

  it("throws on levels that break the rules", () => {
    expect(() => toClock(rowFrom({ levels: [] }))).toThrow();
  });
});

describe("mergeClockRow", () => {
  const current = makeClock({ status: "setup" });

  it("applies the changed columns", () => {
    const merged = mergeClockRow(current, {
      status: "running",
      level_started_at: "2026-11-27T19:00:00.000Z",
    });
    expect(merged).toMatchObject({
      status: "running",
      level_started_at: "2026-11-27T19:00:00.000Z",
      level_index: 0,
    });
  });

  it("keeps the levels when an update leaves them out", () => {
    const merged = mergeClockRow(current, {
      ...rowFrom({ status: "paused", paused_remaining_ms: 1000 }),
      levels: undefined,
    });
    expect(merged.levels).toEqual(NLPT_STANDARD_LEVELS);
    expect(merged.status).toBe("paused");
  });

  it("clears a column set to null", () => {
    const runningClock = makeClock({
      status: "running",
      level_started_at: "2026-11-27T19:00:00.000Z",
    });
    const merged = mergeClockRow(runningClock, {
      status: "paused",
      level_started_at: null,
      paused_remaining_ms: 60_000,
    });
    expect(merged.level_started_at).toBeNull();
  });
});

describe("getClock", () => {
  it("treats an id that isn't a uuid as no clock, without asking the database", async () => {
    const db = {} as SupabaseClient;
    await expect(getClock(db, "not-a-clock")).resolves.toEqual({
      data: null,
      error: null,
    });
  });
});

// A client whose clocks query resolves to result, recording the statuses
// it was filtered on.
function fakeClocksDb(result: { data: unknown; error: unknown }): {
  db: SupabaseClient;
  statuses: () => unknown;
} {
  let statuses: unknown = null;
  const query = {
    select: () => query,
    in: (_column: string, values: unknown) => {
      statuses = values;
      return Promise.resolve(result);
    },
  };
  const db = { from: () => query } as unknown as SupabaseClient;
  return { db, statuses: () => statuses };
}

describe("getLiveClocks", () => {
  it("asks only for running and paused clocks, as clocks", async () => {
    const row = rowFrom({ status: "running", buy_in: "40" });
    const { db, statuses } = fakeClocksDb({ data: [row], error: null });
    const clocks = await getLiveClocks(db);
    expect(statuses()).toEqual(["running", "paused"]);
    expect(clocks).toHaveLength(1);
    expect(clocks[0].buy_in).toBe(40);
  });

  it("returns no clocks when the query fails", async () => {
    const { db } = fakeClocksDb({
      data: null,
      error: { message: "offline" },
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(getLiveClocks(db)).resolves.toEqual([]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
