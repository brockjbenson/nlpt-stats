import { MS_PER_MINUTE } from "@/features/clock/lib/levels";
import type { Result } from "@/features/clock/lib/result";
import {
  adjustTime,
  type ClockControlRefusal,
  type ClockUpdate,
  getClockPosition,
  goToLevel,
  pauseClock,
  resumeClock,
  startClock,
} from "@/features/clock/lib/timing";
import type { TournamentClock } from "@/features/clock/types";

// A button on the admin control screen.
export type ClockControl =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "adjust"; minutes: 1 | -1 };

// The level the clock is effectively on, plus step. Next and previous go
// from there, not the saved level, which can lag behind while running.
function steppedLevel(
  clock: TournamentClock,
  step: 1 | -1,
  nowMs: number,
): number {
  return getClockPosition(clock, nowMs).levelIndex + step;
}

// The columns a control saves, or why it can't be done now.
export function planControl(
  clock: TournamentClock,
  control: ClockControl,
  nowMs: number,
): Result<ClockUpdate, ClockControlRefusal> {
  switch (control.type) {
    case "start":
      return startClock(clock, nowMs);
    case "pause":
      return pauseClock(clock, nowMs);
    case "resume":
      return resumeClock(clock, nowMs);
    case "next":
      return goToLevel(clock, steppedLevel(clock, 1, nowMs), nowMs);
    case "previous":
      return goToLevel(clock, steppedLevel(clock, -1, nowMs), nowMs);
    case "adjust":
      return adjustTime(clock, control.minutes * MS_PER_MINUTE, nowMs);
  }
}

// The clock with a control's columns applied, as it will be once saved.
// The control screen shows this at once while the action runs.
export function applyUpdate(
  clock: TournamentClock,
  update: ClockUpdate,
): TournamentClock {
  return { ...clock, ...update };
}

const REFUSAL_MESSAGES: Record<ClockControlRefusal, string> = {
  wrong_status: "The clock isn't in a state for that.",
  level_out_of_range: "There's no level that way.",
};

export function controlRefusalMessage(reason: ClockControlRefusal): string {
  return REFUSAL_MESSAGES[reason];
}
