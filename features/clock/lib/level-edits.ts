import { cleanNote, levelDurationMs } from "@/features/clock/lib/levels";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import { validateLevels } from "@/features/clock/lib/structures";
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

// The columns a level save writes: the new levels and the timing that keeps
// the current level's time right.
export type LevelEdit = ClockUpdate & { levels: BlindLevel[] };

export type LevelEditRefusal = "finished" | "invalid_levels" | "clock_moved";

// A level as the clock stores it: the playing fields, and the note only on
// a break that has one. Drops editor-only fields such as `key`.
function toSavedLevel(level: BlindLevel): BlindLevel {
  const note = level.kind === "break" ? cleanNote(level.note) : null;
  return {
    kind: level.kind,
    small_blind: level.small_blind ?? null,
    big_blind: level.big_blind ?? null,
    ante: level.ante,
    duration_seconds: level.duration_seconds,
    ...(note && { note }),
  };
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

// Running: keeps the time already played in the current level (counting
// time added with +1 min), so a longer level has more left and a shorter one
// has less. If the new length is already used up, the level ends now and the
// next one starts with its full time.
function runningTiming(
  playedMs: number,
  startedAtMs: number,
  newLengthMs: number,
  nowMs: number,
): Pick<ClockUpdate, "level_started_at"> {
  const keepStart = playedMs < newLengthMs;
  return {
    level_started_at: toIso(keepStart ? startedAtMs : nowMs - newLengthMs),
  };
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
    const saved = levels.map(toSavedLevel);
    if (validateLevels(saved).length > 0) return fail("invalid_levels");
    return ok({ levels: saved, level_index: 0 });
  }

  const position = getClockPosition(clock, nowMs);
  const current = position.levelIndex;
  if (levels.length <= current) return fail("clock_moved");

  const merged = [
    ...clock.levels.slice(0, current),
    ...levels.slice(current).map(toSavedLevel),
  ];
  if (validateLevels(merged).length > 0) return fail("invalid_levels");

  const newLengthMs = levelDurationMs(merged[current]);

  if (clock.status === "paused") {
    const playedMs =
      levelDurationMs(clock.levels[current]) - (clock.paused_remaining_ms ?? 0);
    return ok({
      levels: merged,
      level_index: current,
      paused_remaining_ms: Math.max(0, newLengthMs - playedMs),
    });
  }

  const startedAtMs = position.levelStartedAtMs ?? nowMs;
  return ok({
    levels: merged,
    level_index: current,
    ...runningTiming(nowMs - startedAtMs, startedAtMs, newLengthMs, nowMs),
  });
}
