"use client";

import type { ClockView } from "@/features/clock/lib/display";
import {
  planSoundCue,
  type SoundCue,
  type SoundTick,
  soundTickOf,
} from "@/features/clock/lib/sounds";
import { useEffect, useRef } from "react";

// Plays a chime when the display's clock crosses one minute left or
// changes level, by comparing each render's tick with the one before
// (planSoundCue decides). Runs on every render: each countdown tick and
// each Realtime update.
export function useSoundCues(
  view: ClockView,
  nowMs: number,
  play: (cue: SoundCue) => void,
): void {
  const previous = useRef<SoundTick | null>(null);

  useEffect(() => {
    const current = soundTickOf(view, nowMs);
    const cue = planSoundCue(previous.current, current);
    previous.current = current;
    if (cue) play(cue);
  });
}
