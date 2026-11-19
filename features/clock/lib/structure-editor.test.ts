import { describe, expect, it } from "vitest";
import {
  nextBigBlind,
  structureEditorReducer,
  type StructureEditorAction,
} from "@/features/clock/lib/structure-editor";
import { NLPT_STANDARD_LEVELS } from "@/features/clock/lib/test-fixtures";
import {
  type DraftLevel,
  newStructureDraft,
  type StructureDraft,
} from "@/features/clock/lib/structures";

function level(
  key: string,
  smallBlind: number,
  bigBlind: number,
  minutes = 20,
): DraftLevel {
  return {
    key,
    kind: "level",
    small_blind: smallBlind,
    big_blind: bigBlind,
    ante: 0,
    duration_seconds: minutes * 60,
  };
}

function breakRow(key: string, minutes = 10): DraftLevel {
  return {
    key,
    kind: "break",
    small_blind: null,
    big_blind: null,
    ante: 0,
    duration_seconds: minutes * 60,
  };
}

function draftWith(levels: DraftLevel[]): StructureDraft {
  return { ...newStructureDraft(), name: "Test", levels };
}

function run(
  draft: StructureDraft,
  ...actions: StructureEditorAction[]
): StructureDraft {
  return actions.reduce(structureEditorReducer, draft);
}

function keys(draft: StructureDraft): string[] {
  return draft.levels.map(({ key }) => key);
}

describe("setField", () => {
  it("changes the name", () => {
    const draft = run(newStructureDraft(), {
      type: "setField",
      field: "name",
      value: "Turbo",
    });
    expect(draft.name).toBe("Turbo");
  });

  it("changes a number field without touching the rest", () => {
    const before = newStructureDraft();
    const after = run(before, {
      type: "setField",
      field: "starting_chips",
      value: 15000,
    });
    expect(after).toEqual({ ...before, starting_chips: 15000 });
    expect(before.starting_chips).toBe(20000);
  });
});

describe("setPlacesPaid", () => {
  it("fills in the suggested split", () => {
    const draft = run(newStructureDraft(), { type: "setPlacesPaid", value: 3 });
    expect(draft).toMatchObject({ places_paid: 3, payout_pcts: [65, 35] });
  });

  it("pads with zeros when there's no suggestion", () => {
    const draft = run(
      newStructureDraft(),
      { type: "setPlacesPaid", value: 3 },
      { type: "setPlacesPaid", value: 6 },
    );
    expect(draft.payout_pcts).toEqual([65, 35, 0, 0, 0]);
  });

  it("keeps typed values when growing or shrinking", () => {
    // 6 paid: five shares above the last place.
    const six = run(
      newStructureDraft(),
      { type: "setPlacesPaid", value: 6 },
      { type: "setPayoutPct", index: 4, value: 5 },
    );
    expect(six.payout_pcts).toEqual([55, 30, 15, 0, 5]);
    const seven = run(six, { type: "setPlacesPaid", value: 7 });
    expect(seven.payout_pcts).toEqual([55, 30, 15, 0, 5, 0]);
    const backToSix = run(seven, { type: "setPlacesPaid", value: 6 });
    expect(backToSix.payout_pcts).toEqual([55, 30, 15, 0, 5]);
  });

  it("keeps the percentages for a number it can't use", () => {
    const draft = run(newStructureDraft(), {
      type: "setPlacesPaid",
      value: Number.NaN,
    });
    expect(draft.payout_pcts).toEqual([55, 30, 15]);
    expect(draft.places_paid).toBeNaN();
  });
});

describe("setPayoutPct", () => {
  it("changes one place's share", () => {
    const draft = run(newStructureDraft(), {
      type: "setPayoutPct",
      index: 1,
      value: 25,
    });
    expect(draft.payout_pcts).toEqual([55, 25, 15]);
  });
});

describe("addLevel", () => {
  it("suggests the next blinds from the last level", () => {
    const draft = run(draftWith([level("a", 300, 600, 15)]), {
      type: "addLevel",
      key: "b",
    });
    expect(draft.levels[1]).toEqual(level("b", 400, 800, 15));
  });

  it("skips a break when suggesting", () => {
    const draft = run(draftWith([level("a", 300, 600), breakRow("b")]), {
      type: "addLevel",
      key: "c",
    });
    expect(draft.levels[2]).toEqual(level("c", 400, 800));
  });

  it.each([
    [100, 200, 150, 300],
    [150, 300, 200, 400],
    [300, 600, 400, 800],
    [600, 1200, 750, 1500],
    [1000, 2000, 1500, 3000],
    [4000, 8000, 5000, 10000],
    [15000, 30000, 20000, 40000],
    [20000, 40000, 25000, 50000],
    // A big blind between rungs goes to the next one up.
    [175, 350, 200, 400],
  ])(
    "after %i/%i suggests %i/%i (the next round big blind)",
    (small, big, nextSmall, nextBig) => {
      const draft = run(draftWith([level("a", small, big)]), {
        type: "addLevel",
        key: "b",
      });
      expect(draft.levels[1]).toMatchObject({
        small_blind: nextSmall,
        big_blind: nextBig,
      });
    },
  );

  it("starts at 100/200 with no levels to follow", () => {
    const draft = run(draftWith([breakRow("a")]), {
      type: "addLevel",
      key: "b",
    });
    expect(draft.levels[1]).toEqual(level("b", 100, 200));
  });
});

describe("nextBigBlind", () => {
  it("builds NLPT Standard one step at a time", () => {
    const bigBlinds = NLPT_STANDARD_LEVELS.flatMap(({ big_blind }) =>
      big_blind === null ? [] : [big_blind],
    );
    bigBlinds.slice(1).forEach((bigBlind, index) => {
      expect(nextBigBlind(bigBlinds[index])).toBe(bigBlind);
    });
  });
});

describe("addBreak", () => {
  it("adds a 10-minute break at the end", () => {
    const draft = run(draftWith([level("a", 100, 200)]), {
      type: "addBreak",
      key: "b",
    });
    expect(draft.levels[1]).toEqual(breakRow("b"));
  });
});

describe("updateLevel", () => {
  it("changes one row", () => {
    const draft = run(draftWith([level("a", 100, 200), level("b", 200, 400)]), {
      type: "updateLevel",
      index: 1,
      change: { big_blind: 500, ante: 50 },
    });
    expect(draft.levels[1]).toMatchObject({ big_blind: 500, ante: 50 });
    expect(draft.levels[0]).toEqual(level("a", 100, 200));
  });

  it("clears blinds when a level becomes a break", () => {
    const draft = run(draftWith([level("a", 100, 200), level("b", 200, 400)]), {
      type: "updateLevel",
      index: 1,
      change: { kind: "break" },
    });
    expect(draft.levels[1]).toEqual(breakRow("b"));
  });

  it("suggests blinds when a break becomes a level", () => {
    const draft = run(
      draftWith([level("a", 300, 600), breakRow("b"), level("c", 1000, 2000)]),
      { type: "updateLevel", index: 1, change: { kind: "level" } },
    );
    expect(draft.levels[1]).toEqual(level("b", 400, 800));
  });
});

describe("reorderLevel", () => {
  const start = draftWith([
    level("a", 100, 200),
    breakRow("b"),
    level("c", 200, 400),
    level("d", 300, 600),
  ]);

  it("moves a row down to a later position", () => {
    expect(keys(run(start, { type: "reorderLevel", from: 0, to: 2 }))).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves a row up to an earlier position", () => {
    expect(keys(run(start, { type: "reorderLevel", from: 3, to: 1 }))).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("does nothing for the same position or one out of range", () => {
    expect(run(start, { type: "reorderLevel", from: 1, to: 1 })).toBe(start);
    expect(run(start, { type: "reorderLevel", from: 1, to: 9 })).toBe(start);
    expect(run(start, { type: "reorderLevel", from: -1, to: 2 })).toBe(start);
  });
});

describe("removeLevel", () => {
  it("removes a row", () => {
    const draft = run(draftWith([level("a", 100, 200), breakRow("b")]), {
      type: "removeLevel",
      index: 1,
    });
    expect(keys(draft)).toEqual(["a"]);
  });

  it("keeps the last row", () => {
    const start = draftWith([level("a", 100, 200)]);
    expect(run(start, { type: "removeLevel", index: 0 })).toBe(start);
  });
});
