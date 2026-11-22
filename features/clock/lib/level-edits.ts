import { levelDurationMs, toStoredLevel } from "@/features/clock/lib/levels";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import type { LevelsDraft } from "@/features/clock/lib/structure-editor";
import {
  DEFAULT_BREAK_SECONDS,
  DEFAULT_LEVEL_SECONDS,
  type DraftLevel,
  mostCommonSeconds,
  validateLevels,
} from "@/features/clock/lib/structures";
import {
  type ClockUpdate,
  getClockPosition,
} from "@/features/clock/lib/timing";
import type {
  BlindLevel,
  ClockStatus,
  TournamentClock,
} from "@/features/clock/types";

// Which rows of a clock's levels can change. Rows before firstEditable have
// been played and are fixed; rows before firstMovable can change in place
// but not be moved or removed (the level being played).
export type LevelLocks = { firstEditable: number; firstMovable: number };

// Decides what can change in a clock's levels: everything before it starts,
// the current level's values and everything after it once it runs, and
// nothing once it's finished. Null means no edits.
export function levelEditLocks(
  status: ClockStatus,
  currentIndex: number,
): LevelLocks | null {
  switch (status) {
    case "setup":
      return { firstEditable: 0, firstMovable: 0 };
    case "running":
    case "paused":
      return { firstEditable: currentIndex, firstMovable: currentIndex + 1 };
    case "finished":
      return null;
  }
}

// The level editor's key for the clock's saved row at `index`. Rows added
// in the editor get keys of their own ("new-row-N"), so keys never clash.
export function savedRowKey(index: number): string {
  return `saved-${index}`;
}

// A clock's levels ready for the level editor: each row keyed by its place
// in the saved list (savedRowKey), and new rows as long as most of the
// clock's levels and breaks (as for a template).
export function clockLevelsDraft(
  clock: Pick<TournamentClock, "levels">,
): LevelsDraft {
  const { levels } = clock;
  return {
    levels: levels.map((level, index) => ({
      ...level,
      key: savedRowKey(index),
    })),
    new_level_seconds: mostCommonSeconds(
      levels,
      "level",
      DEFAULT_LEVEL_SECONDS,
    ),
    new_break_seconds: mostCommonSeconds(
      levels,
      "break",
      DEFAULT_BREAK_SECONDS,
    ),
  };
}

// Lines the editor's rows up with the clock after it moves to another
// level. Rows lock by position but are matched here by key, so upcoming rows
// the admin moved or removed before the clock got to them are never
// duplicated or lost:
// - the played rows become the saved ones, as they were really played;
// - the current row is the saved row the clock is playing, keeping any edits
//   made to it, or back as saved if the admin had removed it;
// - every other row follows, in the editor's order.
// The save still merges by position, so a level that ends between the last
// line-up and a save lets the first upcoming row become the current one.
export function alignDraftToClock(
  draft: DraftLevel[],
  saved: BlindLevel[],
  firstEditable: number,
  hasCurrent: boolean,
): DraftLevel[] {
  // The clock can't be past its own levels.
  if (firstEditable >= saved.length) return draft;

  const fixed: DraftLevel[] = saved
    .slice(0, firstEditable)
    .map((level, index) => ({ ...level, key: savedRowKey(index) }));
  if (hasCurrent) {
    const currentKey = savedRowKey(firstEditable);
    fixed.push(
      draft.find(({ key }) => key === currentKey) ?? {
        ...saved[firstEditable],
        key: currentKey,
      },
    );
  }
  const fixedKeys = new Set(fixed.map(({ key }) => key));
  return [...fixed, ...draft.filter(({ key }) => !fixedKeys.has(key))];
}

// Whether the edited levels would save anything different from the saved
// ones. Ignores row keys, and catches edits typed then undone.
export function levelsChanged(
  saved: BlindLevel[],
  draft: DraftLevel[],
): boolean {
  return (
    JSON.stringify(saved.map(toStoredLevel)) !==
    JSON.stringify(draft.map(toStoredLevel))
  );
}

// The columns a level save writes: the new levels and the timing that keeps
// the current level's time right.
export type LevelEdit = ClockUpdate & { levels: BlindLevel[] };

export type LevelEditRefusal = "finished" | "invalid_levels" | "clock_moved";

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

// Running: when the current level counts as started. Keeps the time already
// played (counting time added with +1 min), so a longer level has more left
// and a shorter one has less. If the new length is already used up, the
// level ends now and the next one starts with its full time.
function runningStartMs(
  startedAtMs: number,
  newLengthMs: number,
  nowMs: number,
): number {
  const playedMs = nowMs - startedAtMs;
  return playedMs < newLengthMs ? startedAtMs : nowMs - newLengthMs;
}

// Paused: the time left after the level's length changes. The time already
// played stays, and nothing is left once the new length is used up.
function pausedRemainingMs(
  oldLengthMs: number,
  oldRemainingMs: number,
  newLengthMs: number,
): number {
  const playedMs = oldLengthMs - oldRemainingMs;
  return Math.max(0, newLengthMs - playedMs);
}

// Decides what saving an edited list of levels writes. Rows already played
// are kept as saved; the current row onward come from the sent list. The
// time left in the current level follows its new length, never resetting.
export function planLevelEdit(
  clock: TournamentClock,
  levels: BlindLevel[],
  nowMs: number,
): Result<LevelEdit, LevelEditRefusal> {
  if (clock.status === "finished") return fail("finished");

  if (clock.status === "setup") {
    const saved = levels.map(toStoredLevel);
    if (validateLevels(saved).length > 0) return fail("invalid_levels");
    return ok({ levels: saved, level_index: 0 });
  }

  const position = getClockPosition(clock, nowMs);
  const current = position.levelIndex;
  if (levels.length <= current) return fail("clock_moved");

  const merged = [
    ...clock.levels.slice(0, current),
    ...levels.slice(current).map(toStoredLevel),
  ];
  if (validateLevels(merged).length > 0) return fail("invalid_levels");

  const newLengthMs = levelDurationMs(merged[current]);

  if (clock.status === "paused") {
    return ok({
      levels: merged,
      level_index: current,
      paused_remaining_ms: pausedRemainingMs(
        levelDurationMs(clock.levels[current]),
        clock.paused_remaining_ms ?? 0,
        newLengthMs,
      ),
    });
  }

  const startedAtMs = position.levelStartedAtMs ?? nowMs;
  return ok({
    levels: merged,
    level_index: current,
    level_started_at: toIso(runningStartMs(startedAtMs, newLengthMs, nowMs)),
  });
}
