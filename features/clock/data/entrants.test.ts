import { describe, expect, it } from "vitest";
import {
  applyRowChange,
  memberNamesFilter,
  removeRow,
  upsertRow,
} from "@/features/clock/data/entrants";

const A = { id: "a", value: 1 };
const B = { id: "b", value: 2 };

describe("upsertRow", () => {
  it("replaces a row with the same id, keeping its place", () => {
    expect(upsertRow([A, B], { id: "a", value: 9 })).toEqual([
      { id: "a", value: 9 },
      B,
    ]);
  });

  it("adds a new row at the end", () => {
    expect(upsertRow([A], B)).toEqual([A, B]);
  });

  it("doesn't change the list it was given", () => {
    const rows = [A];
    upsertRow(rows, B);
    expect(rows).toEqual([A]);
  });
});

describe("removeRow", () => {
  it("drops the row with that id", () => {
    expect(removeRow([A, B], "a")).toEqual([B]);
  });

  it("leaves the list alone when the id isn't there", () => {
    expect(removeRow([A, B], "z")).toEqual([A, B]);
  });
});

describe("memberNamesFilter", () => {
  const ID_1 = "11111111-1111-4111-8111-111111111111";
  const ID_2 = "22222222-2222-4222-8222-222222222222";

  it("asks for visible members when nobody else is playing", () => {
    expect(memberNamesFilter([])).toBe("visible.eq.true");
  });

  it("also asks for the members playing", () => {
    expect(memberNamesFilter([ID_1, ID_2, ID_1])).toBe(
      `visible.eq.true,id.in.(${ID_1},${ID_2})`,
    );
  });

  it("leaves out anything that isn't an id", () => {
    expect(memberNamesFilter(["1),visible.eq.false", ID_1])).toBe(
      `visible.eq.true,id.in.(${ID_1})`,
    );
  });
});

describe("applyRowChange", () => {
  const MINE = { id: "a", clock_id: "clock-1", rebuys: 0 };
  const OTHER = { id: "z", clock_id: "clock-2", rebuys: 0 };

  it("adds an inserted row for this clock", () => {
    expect(
      applyRowChange(
        [],
        { eventType: "INSERT", new: MINE, old: {} },
        "clock-1",
      ),
    ).toEqual([MINE]);
  });

  it("replaces an updated row", () => {
    const updated = { ...MINE, rebuys: 1 };
    expect(
      applyRowChange(
        [MINE],
        { eventType: "UPDATE", new: updated, old: MINE },
        "clock-1",
      ),
    ).toEqual([updated]);
  });

  it("removes a deleted row of this clock", () => {
    expect(
      applyRowChange(
        [MINE],
        { eventType: "DELETE", new: {}, old: MINE },
        "clock-1",
      ),
    ).toEqual([]);
  });

  it("ignores rows of another clock, including deletes", () => {
    const rows = [MINE];
    expect(
      applyRowChange(
        rows,
        { eventType: "INSERT", new: OTHER, old: {} },
        "clock-1",
      ),
    ).toBe(rows);
    expect(
      applyRowChange(
        rows,
        { eventType: "DELETE", new: {}, old: { ...OTHER, id: "a" } },
        "clock-1",
      ),
    ).toBe(rows);
  });
});
