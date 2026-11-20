import {
  formatBlindPair,
  formatChips,
  formatClockTime,
} from "@/features/clock/lib/format";
import { levelDurationMs, levelNumber } from "@/features/clock/lib/levels";
import {
  type ClockPosition,
  getClockPosition,
  nextPlayingLevel,
  timeToNextBreakMs,
} from "@/features/clock/lib/timing";
import type {
  BlindLevel,
  ClockStatus,
  TournamentClock,
} from "@/features/clock/types";

// A playing level's blinds for the display: "1,000 / 2,000", and the ante
// ("200") or null when there isn't one.
export type BlindsText = {
  blinds: string;
  ante: string | null;
};

// Everything a clock screen shows at one moment, worked out from the saved
// clock and the (server-corrected) current time.
export type ClockView = {
  status: ClockStatus;
  position: ClockPosition;
  // "Level 5" or "Break".
  title: string;
  isBreak: boolean;
  // The break's note, or null.
  note: string | null;
  // The current level's blinds and ante; null on a break.
  blinds: string | null;
  ante: string | null;
  // The next playing level, or null after the last one.
  next: BlindsText | null;
  // Time until the next break starts; null on a break or with none ahead.
  nextBreakMs: number | null;
  timeText: string;
  // How much of the current level has been played, 0–1. Time added past
  // the level's length counts as none played.
  progress: number;
  isFinalLevel: boolean;
  // Running on the last level with no time left. The clock doesn't wrap;
  // it stays at 0:00.
  isOutOfTime: boolean;
};

function anteText(level: BlindLevel): string | null {
  return level.ante > 0 ? formatChips(level.ante) : null;
}

function blindsText(level: BlindLevel): BlindsText {
  return { blinds: formatBlindPair(level), ante: anteText(level) };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function levelTitle(levels: BlindLevel[], index: number): string {
  const number = levelNumber(levels, index);
  return number === null ? "Break" : `Level ${number}`;
}

export function describeClock(
  clock: TournamentClock,
  nowMs: number,
): ClockView {
  const { levels } = clock;
  const position = getClockPosition(clock, nowMs);
  const level = levels[position.levelIndex];
  const isBreak = level.kind === "break";
  const next = nextPlayingLevel(levels, position.levelIndex);

  return {
    status: clock.status,
    position,
    title: levelTitle(levels, position.levelIndex),
    isBreak,
    note: isBreak ? (level.note ?? null) : null,
    blinds: isBreak ? null : formatBlindPair(level),
    ante: isBreak ? null : anteText(level),
    next: next ? blindsText(next) : null,
    nextBreakMs: timeToNextBreakMs(levels, position),
    timeText: formatClockTime(position.remainingMs),
    progress: clamp01(1 - position.remainingMs / levelDurationMs(level)),
    isFinalLevel: position.isLastLevel,
    isOutOfTime:
      clock.status === "running" &&
      position.isLastLevel &&
      position.remainingMs === 0,
  };
}
