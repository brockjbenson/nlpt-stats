import { levelDurationMs } from "@/features/clock/lib/levels";
import type { BlindLevel, TournamentClock } from "@/features/clock/types";

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
