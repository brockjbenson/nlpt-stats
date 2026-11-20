import type { ClockView } from "@/features/clock/lib/display";
import type { ClockStatus } from "@/features/clock/types";

// What the display chimes for: a minute left, a new playing level, a break.
export type SoundCue = "warning" | "level" | "break";

// The warning plays when the time left crosses this.
export const WARNING_MS = 60_000;
// Ticks further apart than this are a jump (loading, a tab waking up, a
// refetch after reconnecting), not the clock running: no chime for them.
// The display ticks every 250 ms, so this allows for a few slow frames.
export const MAX_TICK_GAP_MS = 2_000;

// The parts of one display tick the chimes depend on.
export type SoundTick = {
  status: ClockStatus;
  levelIndex: number;
  remainingMs: number;
  isBreak: boolean;
  // The (server-corrected) time of the tick.
  nowMs: number;
};

export function soundTickOf(view: ClockView, nowMs: number): SoundTick {
  return {
    status: view.status,
    levelIndex: view.position.levelIndex,
    remainingMs: view.position.remainingMs,
    isBreak: view.isBreak,
    nowMs,
  };
}

function isContinuousRun(previous: SoundTick, current: SoundTick): boolean {
  return (
    previous.status === "running" &&
    current.status === "running" &&
    Math.abs(current.nowMs - previous.nowMs) <= MAX_TICK_GAP_MS
  );
}

// The chime to play for the change from the previous tick to this one, or
// null. Chimes only play while the clock keeps running between two nearby
// ticks: starting, pausing, resuming, changes made while paused, and jumps
// (loading, waking, refetching) stay silent.
export function planSoundCue(
  previous: SoundTick | null,
  current: SoundTick,
): SoundCue | null {
  if (!previous || !isContinuousRun(previous, current)) return null;
  if (current.levelIndex !== previous.levelIndex) {
    return current.isBreak ? "break" : "level";
  }
  const crossedWarning =
    previous.remainingMs > WARNING_MS &&
    current.remainingMs <= WARNING_MS &&
    current.remainingMs > 0;
  return crossedWarning ? "warning" : null;
}
