import { describe, expect, it } from "vitest";
import {
  alignDraftToClock,
  clockLevelsDraft,
  levelEditLocks,
  type LevelEdit,
  levelsChanged,
  planLevelEdit,
  savedRowKey,
} from "@/features/clock/lib/level-edits";
import { toStoredLevel } from "@/features/clock/lib/levels";
import { levelsReducer } from "@/features/clock/lib/structure-editor";
import {
  DEFAULT_BREAK_SECONDS,
  type DraftLevel,
} from "@/features/clock/lib/structures";
import { getClockPosition } from "@/features/clock/lib/timing";
import {
  makeClock,
  NLPT_STANDARD_LEVELS,
  satisfiesStatusRule,
} from "@/features/clock/lib/test-fixtures";
import type { BlindLevel, TournamentClock } from "@/features/clock/types";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

// Level 3 (index 2) started five minutes before `nowMs`.
function runningClock(startOffsetMs = -5 * MINUTE): {
  clock: TournamentClock;
  nowMs: number;
} {
  const nowMs = START_MS;
  const clock = makeClock({
    status: "running",
    level_index: 2,
    level_started_at: new Date(nowMs + startOffsetMs).toISOString(),
  });
  return { clock, nowMs };
}

function withLength(
  levels: BlindLevel[],
  index: number,
  minutes: number,
): BlindLevel[] {
  return levels.map((level, i) =>
    i === index ? { ...level, duration_seconds: minutes * 60 } : level,
  );
}

function planned(
  clock: TournamentClock,
  levels: BlindLevel[],
  nowMs: number,
): { edit: LevelEdit; updated: TournamentClock } {
  const result = planLevelEdit(clock, levels, nowMs);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  const updated = { ...clock, ...result.value };
  expect(satisfiesStatusRule(updated)).toBe(true);
  return { edit: result.value, updated };
}

function minutesLeft(clock: TournamentClock, nowMs: number): number {
  return getClockPosition(clock, nowMs).remainingMs / MINUTE;
}

describe("levelEditLocks", () => {
  it("lets everything change in setup", () => {
    expect(levelEditLocks("setup", 0)).toEqual({
      firstEditable: 0,
      firstMovable: 0,
    });
  });

  it("locks played rows and pins the current row while running or paused", () => {
    const locks = { firstEditable: 4, firstMovable: 5 };
    expect(levelEditLocks("running", 4)).toEqual(locks);
    expect(levelEditLocks("paused", 4)).toEqual(locks);
  });

  it("allows no edits once finished", () => {
    expect(levelEditLocks("finished", 4)).toBeNull();
  });
});

describe("planLevelEdit in setup", () => {
  it("saves a reordered and shortened list whole", () => {
    const sent = [...NLPT_STANDARD_LEVELS].reverse().slice(0, 5);
    const { edit } = planned(makeClock(), sent, START_MS);
    expect(edit).toEqual({ levels: sent, level_index: 0 });
  });

  it("refuses a bad row", () => {
    const sent = [{ ...NLPT_STANDARD_LEVELS[0], big_blind: 1 }];
    expect(planLevelEdit(makeClock(), sent, START_MS)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });

  it("refuses a list with nothing to play", () => {
    const sent = [NLPT_STANDARD_LEVELS[4]];
    expect(planLevelEdit(makeClock(), sent, START_MS)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });

  it("saves only the stored fields, with a note only on breaks that have one", () => {
    const sent = [
      { ...NLPT_STANDARD_LEVELS[0], key: "a" },
      { ...NLPT_STANDARD_LEVELS[4], note: " Color up ", key: "b" },
      { ...NLPT_STANDARD_LEVELS[4], note: "  ", key: "c" },
    ] satisfies DraftLevel[];
    const { edit } = planned(makeClock(), sent, START_MS);
    expect(edit.levels).toEqual([
      { ...NLPT_STANDARD_LEVELS[0] },
      { ...NLPT_STANDARD_LEVELS[4], note: "Color up" },
      { ...NLPT_STANDARD_LEVELS[4] },
    ]);
    expect(edit.levels.every((level) => !("key" in level))).toBe(true);
    expect("note" in edit.levels[2]).toBe(false);
  });

  it("drops a note sent on a row that isn't a break", () => {
    const sent = [
      { ...NLPT_STANDARD_LEVELS[0], note: "Not a break" },
      NLPT_STANDARD_LEVELS[4],
    ];
    const { edit } = planned(makeClock(), sent, START_MS);
    expect(edit.levels[0]).toEqual(NLPT_STANDARD_LEVELS[0]);
    expect("note" in edit.levels[0]).toBe(false);
  });
});

describe("planLevelEdit while running", () => {
  it("keeps the time played when the level is lengthened", () => {
    const { clock, nowMs } = runningClock();
    const sent = withLength(clock.levels, 2, 30);
    const { updated } = planned(clock, sent, nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(25);
    expect(updated.status).toBe("running");
    expect(updated.paused_remaining_ms).toBeNull();
  });

  it("keeps the time played when the level is shortened", () => {
    const { clock, nowMs } = runningClock();
    const { updated } = planned(clock, withLength(clock.levels, 2, 10), nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(5);
  });

  it("ends the level now when the new length is already used up", () => {
    const { clock, nowMs } = runningClock();
    const { edit, updated } = planned(
      clock,
      withLength(clock.levels, 2, 4),
      nowMs,
    );
    expect(edit.level_index).toBe(2);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 3,
      remainingMs: 20 * MINUTE,
    });
  });

  it("keeps time added with +1 min after a length change", () => {
    const { clock, nowMs } = runningClock(2 * MINUTE);
    expect(minutesLeft(clock, nowMs)).toBe(22);
    const { updated } = planned(clock, withLength(clock.levels, 2, 30), nowMs);
    expect(minutesLeft(updated, nowMs)).toBe(32);
  });

  it("keeps played rows as saved even when the sent ones changed", () => {
    const { clock, nowMs } = runningClock();
    const sent = clock.levels.map((level, i) =>
      i < 2 ? { ...level, small_blind: 1, big_blind: 2 } : level,
    );
    const { edit } = planned(clock, sent, nowMs);
    expect(edit.levels.slice(0, 2)).toEqual(clock.levels.slice(0, 2));
  });

  it("makes the current level last when every upcoming row is removed", () => {
    const { clock, nowMs } = runningClock();
    const { updated } = planned(clock, clock.levels.slice(0, 3), nowMs);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 2,
      isLastLevel: true,
    });
    expect(minutesLeft(updated, nowMs + 30 * MINUTE)).toBe(0);
  });

  it("catches up when the saved level is behind the effective level", () => {
    const nowMs = START_MS + 25 * MINUTE;
    const clock = makeClock({
      status: "running",
      level_index: 0,
      level_started_at: new Date(START_MS).toISOString(),
    });
    expect(getClockPosition(clock, nowMs).levelIndex).toBe(1);
    const sent = withLength(clock.levels, 1, 30);
    const { updated } = planned(clock, sent, nowMs);
    expect(updated.level_index).toBe(1);
    expect(getClockPosition(updated, nowMs)).toMatchObject({
      levelIndex: 1,
      remainingMs: 25 * MINUTE,
    });
  });

  it("refuses a list too short for the current level", () => {
    const { clock, nowMs } = runningClock();
    expect(planLevelEdit(clock, clock.levels.slice(0, 2), nowMs)).toEqual({
      ok: false,
      reason: "clock_moved",
    });
  });

  it("refuses an invalid upcoming row", () => {
    const { clock, nowMs } = runningClock();
    const sent = clock.levels.map((level, i) =>
      i === 5 ? { ...level, duration_seconds: 0 } : level,
    );
    expect(planLevelEdit(clock, sent, nowMs)).toEqual({
      ok: false,
      reason: "invalid_levels",
    });
  });
});

describe("planLevelEdit while paused", () => {
  function paused(): TournamentClock {
    return makeClock({
      status: "paused",
      level_index: 2,
      paused_remaining_ms: 12 * MINUTE,
    });
  }

  it("adds the extra length to the time left", () => {
    const clock = paused();
    const { updated } = planned(
      clock,
      withLength(clock.levels, 2, 25),
      START_MS,
    );
    expect(minutesLeft(updated, START_MS)).toBe(17);
    expect(updated.status).toBe("paused");
  });

  it("runs out the level when shortened below the time played", () => {
    const clock = paused();
    const { updated } = planned(
      clock,
      withLength(clock.levels, 2, 5),
      START_MS,
    );
    expect(minutesLeft(updated, START_MS)).toBe(0);
  });
});

describe("planLevelEdit when finished", () => {
  it("refuses", () => {
    const clock = makeClock({ status: "finished", paused_remaining_ms: 0 });
    expect(planLevelEdit(clock, clock.levels, START_MS)).toEqual({
      ok: false,
      reason: "finished",
    });
  });
});

describe("clockLevelsDraft", () => {
  it("keys every row by its saved place and keeps its fields", () => {
    const draft = clockLevelsDraft(makeClock());
    expect(draft.levels).toEqual(
      NLPT_STANDARD_LEVELS.map((level, index) => ({
        ...level,
        key: `saved-${index}`,
      })),
    );
  });

  it("gives new rows the clock's most common level and break lengths", () => {
    const level = (minutes: number): BlindLevel => ({
      ...NLPT_STANDARD_LEVELS[0],
      duration_seconds: minutes * 60,
    });
    const breakOf = (minutes: number): BlindLevel => ({
      ...NLPT_STANDARD_LEVELS[4],
      duration_seconds: minutes * 60,
    });
    const levels = [
      level(15),
      level(15),
      breakOf(5),
      level(30),
      breakOf(5),
      level(15),
      breakOf(20),
    ];
    const draft = clockLevelsDraft(makeClock({ levels }));
    expect(draft.new_level_seconds).toBe(15 * 60);
    expect(draft.new_break_seconds).toBe(5 * 60);
  });

  it("falls back to the default break length with no breaks", () => {
    const levels = NLPT_STANDARD_LEVELS.slice(0, 4);
    const draft = clockLevelsDraft(makeClock({ levels }));
    expect(draft.new_level_seconds).toBe(20 * 60);
    expect(draft.new_break_seconds).toBe(DEFAULT_BREAK_SECONDS);
  });
});

describe("levelsChanged", () => {
  function draftLevels(): DraftLevel[] {
    return clockLevelsDraft(makeClock()).levels;
  }

  it("is false for the same levels with new keys", () => {
    expect(levelsChanged(NLPT_STANDARD_LEVELS, draftLevels())).toBe(false);
  });

  it("is true after an edit", () => {
    const edited = draftLevels().map((row, index) =>
      index === 3 ? { ...row, ante: 100 } : row,
    );
    expect(levelsChanged(NLPT_STANDARD_LEVELS, edited)).toBe(true);
  });

  it("is true after a row is removed", () => {
    expect(levelsChanged(NLPT_STANDARD_LEVELS, draftLevels().slice(1))).toBe(
      true,
    );
  });

  it("is false after an edit typed then changed back", () => {
    const draft = clockLevelsDraft(makeClock());
    const typed = levelsReducer(draft, {
      type: "updateLevel",
      index: 3,
      change: { ante: 100 },
    });
    const undone = levelsReducer(typed, {
      type: "updateLevel",
      index: 3,
      change: { ante: 0 },
    });
    expect(levelsChanged(NLPT_STANDARD_LEVELS, typed.levels)).toBe(true);
    expect(levelsChanged(NLPT_STANDARD_LEVELS, undone.levels)).toBe(false);
  });

  it("treats a saved empty note the same as no note", () => {
    const saved = NLPT_STANDARD_LEVELS.map((level) =>
      level.kind === "break" ? { ...level, note: null } : level,
    );
    expect(levelsChanged(saved, draftLevels())).toBe(false);
  });
});

describe("alignDraftToClock", () => {
  const saved = NLPT_STANDARD_LEVELS;

  // The clock's rows as the page opened them.
  function openedDraft(): DraftLevel[] {
    return clockLevelsDraft(makeClock()).levels;
  }

  // Saved indexes, in order, as row keys.
  function keysOf(indexes: number[]): string[] {
    return indexes.map(savedRowKey);
  }

  function savedRange(from: number, to: number): number[] {
    return Array.from({ length: to - from }, (_, i) => from + i);
  }

  // Level 7 (index 7) dragged up to index 4, ahead of the first break, as
  // the clock plays index 3.
  function withLevel7Moved(): DraftLevel[] {
    return levelsReducer(clockLevelsDraft(makeClock()), {
      type: "reorderLevel",
      from: 7,
      to: 4,
    }).levels;
  }

  it("keeps every row once when the clock passes a moved row", () => {
    const draft = withLevel7Moved();
    expect(draft.map(({ key }) => key)).toEqual(
      keysOf([0, 1, 2, 3, 7, 4, 5, 6, ...savedRange(8, saved.length)]),
    );

    const aligned = alignDraftToClock(draft, saved, 5, true);
    // Played: 0-4 (the break included). Now: 5. Then the admin's order.
    const order = [0, 1, 2, 3, 4, 5, 7, 6, ...savedRange(8, saved.length)];
    expect(aligned.map(({ key }) => key)).toEqual(keysOf(order));
    expect(aligned.map(toStoredLevel)).toEqual(order.map((i) => saved[i]));
  });

  it("saves the lined-up rows with nothing duplicated or lost", () => {
    const nowMs = START_MS;
    const clock = makeClock({
      status: "running",
      level_index: 5,
      level_started_at: new Date(nowMs - 5 * MINUTE).toISOString(),
    });
    const aligned = alignDraftToClock(withLevel7Moved(), saved, 5, true);
    const { edit } = planned(clock, aligned, nowMs);
    const order = [0, 1, 2, 3, 4, 5, 7, 6, ...savedRange(8, saved.length)];
    expect(edit.levels).toEqual(order.map((i) => saved[i]));
  });

  it("keeps the admin's edits to the row that becomes current", () => {
    const draft = openedDraft().map((row, index) =>
      index === 5 ? { ...row, ante: 100 } : row,
    );
    const aligned = alignDraftToClock(draft, saved, 5, true);
    expect(aligned[5]).toEqual({ ...saved[5], ante: 100, key: savedRowKey(5) });
  });

  it("drops edits typed into a row that has since been played", () => {
    const draft = openedDraft().map((row, index) =>
      index === 3 ? { ...row, ante: 100 } : row,
    );
    const aligned = alignDraftToClock(draft, saved, 5, true);
    expect(aligned[3]).toEqual({ ...saved[3], key: savedRowKey(3) });
    expect(levelsChanged(saved, aligned)).toBe(false);
  });

  it("brings back the current row when the admin had removed it", () => {
    const draft = openedDraft().filter((_, index) => index !== 5);
    const aligned = alignDraftToClock(draft, saved, 5, true);
    expect(aligned.map(({ key }) => key)).toEqual(
      keysOf(savedRange(0, saved.length)),
    );
    expect(aligned[5]).toEqual({ ...saved[5], key: savedRowKey(5) });
  });

  it("keeps rows added in the editor in their place", () => {
    const draft = levelsReducer(clockLevelsDraft(makeClock()), {
      type: "addBreak",
      key: "new-row-1",
    }).levels;
    const aligned = alignDraftToClock(draft, saved, 5, true);
    expect(aligned.map(({ key }) => key)).toEqual([
      ...keysOf(savedRange(0, saved.length)),
      "new-row-1",
    ]);
  });

  it("lines up again when the clock goes back a level", () => {
    const atFive = alignDraftToClock(withLevel7Moved(), saved, 5, true);
    const atFour = alignDraftToClock(atFive, saved, 4, true);
    expect(atFour.map(({ key }) => key)).toEqual(
      keysOf([0, 1, 2, 3, 4, 5, 7, 6, ...savedRange(8, saved.length)]),
    );
  });

  it("leaves a clock in setup as it is", () => {
    const draft = withLevel7Moved();
    expect(alignDraftToClock(draft, saved, 0, false)).toEqual(draft);
  });

  it("leaves the draft as it is past the last saved level", () => {
    const draft = withLevel7Moved();
    expect(alignDraftToClock(draft, saved, saved.length, true)).toBe(draft);
  });
});
