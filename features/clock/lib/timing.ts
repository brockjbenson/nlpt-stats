import { levelDurationMs } from "@/features/clock/lib/levels";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import type {
  BlindLevel,
  ClockStatus,
  TournamentClock,
} from "@/features/clock/types";

// Where a clock is at a moment in time, worked out from what it has saved.
export type ClockPosition = {
  // The level the clock is effectively on, after catching up.
  levelIndex: number;
  // When that level effectively started. Only set while running.
  levelStartedAtMs: number | null;
  // Time left in that level. Never negative; can exceed the level's length
  // when time has been added.
  remainingMs: number;
  isLastLevel: boolean;
};

function lastIndex(levels: BlindLevel[]): number {
  return levels.length - 1;
}

// A saved level past the end (for example after a template change) counts
// as the last level.
function clampIndex(levels: BlindLevel[], index: number): number {
  return Math.min(Math.max(index, 0), lastIndex(levels));
}

function stoppedPosition(
  levels: BlindLevel[],
  levelIndex: number,
  remainingMs: number,
): ClockPosition {
  return {
    levelIndex,
    levelStartedAtMs: null,
    remainingMs,
    isLastLevel: levelIndex === lastIndex(levels),
  };
}

// Walks forward from the saved level until the elapsed time falls inside a
// level. Every screen does this, so the display is right even if nobody has
// saved the advance yet.
function runningPosition(
  levels: BlindLevel[],
  savedIndex: number,
  startedAtMs: number,
  nowMs: number,
): ClockPosition {
  let levelIndex = savedIndex;
  let levelStartedAtMs = startedAtMs;
  while (
    levelIndex < lastIndex(levels) &&
    nowMs - levelStartedAtMs >= levelDurationMs(levels[levelIndex])
  ) {
    levelStartedAtMs += levelDurationMs(levels[levelIndex]);
    levelIndex += 1;
  }

  const elapsedMs = nowMs - levelStartedAtMs;
  return {
    levelIndex,
    levelStartedAtMs,
    remainingMs: Math.max(0, levelDurationMs(levels[levelIndex]) - elapsedMs),
    isLastLevel: levelIndex === lastIndex(levels),
  };
}

export function getClockPosition(
  clock: TournamentClock,
  nowMs: number,
): ClockPosition {
  const { levels } = clock;
  const savedIndex = clampIndex(levels, clock.level_index);

  switch (clock.status) {
    case "setup":
      return stoppedPosition(
        levels,
        savedIndex,
        levelDurationMs(levels[savedIndex]),
      );
    case "paused":
    case "finished":
      return stoppedPosition(
        levels,
        savedIndex,
        clock.paused_remaining_ms ?? 0,
      );
    case "running": {
      const startedAtMs = Date.parse(clock.level_started_at ?? "");
      // The database requires a start time while running; if one is ever
      // missing, show the level's full time rather than NaN.
      if (Number.isNaN(startedAtMs)) {
        return stoppedPosition(
          levels,
          savedIndex,
          levelDurationMs(levels[savedIndex]),
        );
      }
      return runningPosition(levels, savedIndex, startedAtMs, nowMs);
    }
  }
}

// Clock controls. Each returns the _tournament_clocks columns to save, and
// every result satisfies the database's status rule.

export type ClockUpdate = Partial<
  Pick<
    TournamentClock,
    "status" | "level_index" | "level_started_at" | "paused_remaining_ms"
  >
>;

export type ClockControlRefusal = "wrong_status" | "level_out_of_range";

type ControlResult = Result<ClockUpdate, ClockControlRefusal>;

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function hasStatus(clock: TournamentClock, allowed: ClockStatus[]): boolean {
  return allowed.includes(clock.status);
}

function fullTimeMs(clock: TournamentClock, levelIndex: number): number {
  return levelDurationMs(clock.levels[levelIndex]);
}

export function startClock(
  clock: TournamentClock,
  nowMs: number,
): ControlResult {
  if (!hasStatus(clock, ["setup"])) return fail("wrong_status");
  return ok({
    status: "running",
    level_index: clampIndex(clock.levels, clock.level_index),
    level_started_at: toIso(nowMs),
    paused_remaining_ms: null,
  });
}

export function pauseClock(
  clock: TournamentClock,
  nowMs: number,
): ControlResult {
  if (!hasStatus(clock, ["running"])) return fail("wrong_status");
  const position = getClockPosition(clock, nowMs);
  return ok({
    status: "paused",
    level_index: position.levelIndex,
    level_started_at: null,
    paused_remaining_ms: position.remainingMs,
  });
}

// The level's start is set back by the time already played, so the
// countdown continues from the paused time.
export function resumeClock(
  clock: TournamentClock,
  nowMs: number,
): ControlResult {
  if (!hasStatus(clock, ["paused"])) return fail("wrong_status");
  const levelIndex = clampIndex(clock.levels, clock.level_index);
  const playedMs =
    fullTimeMs(clock, levelIndex) - (clock.paused_remaining_ms ?? 0);
  return ok({
    status: "running",
    level_index: levelIndex,
    level_started_at: toIso(nowMs - playedMs),
    paused_remaining_ms: null,
  });
}

// Previous/next level: the chosen level starts with its full time.
export function goToLevel(
  clock: TournamentClock,
  levelIndex: number,
  nowMs: number,
): ControlResult {
  if (!hasStatus(clock, ["running", "paused"])) return fail("wrong_status");
  if (levelIndex < 0 || levelIndex > lastIndex(clock.levels)) {
    return fail("level_out_of_range");
  }
  if (clock.status === "paused") {
    return ok({
      level_index: levelIndex,
      paused_remaining_ms: fullTimeMs(clock, levelIndex),
    });
  }
  return ok({ level_index: levelIndex, level_started_at: toIso(nowMs) });
}

// Adds (positive) or removes (negative) time from the current level. Time
// left never goes below zero; removing more than is left ends the level now.
export function adjustTime(
  clock: TournamentClock,
  deltaMs: number,
  nowMs: number,
): ControlResult {
  if (clock.status === "paused") {
    return ok({
      paused_remaining_ms: Math.max(
        0,
        (clock.paused_remaining_ms ?? 0) + deltaMs,
      ),
    });
  }
  if (!hasStatus(clock, ["running"])) return fail("wrong_status");

  // Adjust from the time left (zero if the last level has run out), then
  // set the start so that much time remains.
  const position = getClockPosition(clock, nowMs);
  const remainingMs = Math.max(0, position.remainingMs + deltaMs);
  const startedAtMs =
    nowMs - (fullTimeMs(clock, position.levelIndex) - remainingMs);
  return ok({
    level_index: position.levelIndex,
    level_started_at: toIso(startedAtMs),
  });
}

// Saves a level change that happened by time running out. Null when there's
// nothing to save. Write it only where level_index still equals the old
// value, so two admin screens can't both advance the clock.
export function catchUpUpdate(
  clock: TournamentClock,
  nowMs: number,
): Pick<ClockUpdate, "level_index" | "level_started_at"> | null {
  if (clock.status !== "running") return null;
  const position = getClockPosition(clock, nowMs);
  if (
    position.levelIndex === clock.level_index ||
    position.levelStartedAtMs === null
  ) {
    return null;
  }
  return {
    level_index: position.levelIndex,
    level_started_at: toIso(position.levelStartedAtMs),
  };
}

export function finishClock(
  clock: TournamentClock,
  nowMs: number,
): ControlResult {
  if (!hasStatus(clock, ["running", "paused"])) return fail("wrong_status");
  const position = getClockPosition(clock, nowMs);
  return ok({
    status: "finished",
    level_index: position.levelIndex,
    level_started_at: null,
    paused_remaining_ms: position.remainingMs,
  });
}
