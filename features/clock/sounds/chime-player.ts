"use client";

import type { SoundCue } from "@/features/clock/lib/sounds";
import { CHIMES, type ChimeNote } from "@/features/clock/sounds/chimes";

// A quick fade-in avoids a click at the start of each note.
const ATTACK_S = 0.01;
// Exponential fades can't reach 0; this is silent.
const SILENT_GAIN = 0.0001;
// A quiet overtone an octave up makes the tone sound like a bell.
const OVERTONE_RATIO = 2;
const OVERTONE_GAIN = 0.2;
// Keeps all chimes below full volume, so stacked notes don't clip.
const MASTER_GAIN = 0.6;

export type ChimePlayer = {
  // Starts audio. Browsers only allow it from a tap, so call it from one;
  // true when sound can play.
  unlock: () => Promise<boolean>;
  isUnlocked: () => boolean;
  // Plays a chime now. Does nothing until unlocked, or without Web Audio.
  play: (cue: SoundCue) => void;
};

type AudioContextClass = typeof AudioContext;

function audioContextClass(): AudioContextClass | null {
  if (typeof window === "undefined") return null;
  // Older Safari only has the prefixed name.
  const prefixed = (
    window as unknown as { webkitAudioContext?: AudioContextClass }
  ).webkitAudioContext;
  return window.AudioContext ?? prefixed ?? null;
}

// One tone: a sine at the note's pitch, faded in and out.
function playTone(
  context: AudioContext,
  output: AudioNode,
  frequencyHz: number,
  startAt: number,
  { durationS, gain }: Pick<ChimeNote, "durationS" | "gain">,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequencyHz;
  envelope.gain.setValueAtTime(SILENT_GAIN, startAt);
  envelope.gain.exponentialRampToValueAtTime(gain, startAt + ATTACK_S);
  envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, startAt + durationS);
  oscillator.connect(envelope).connect(output);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationS);
}

function playChime(context: AudioContext, cue: SoundCue): void {
  const master = context.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(context.destination);
  const now = context.currentTime;
  for (const note of CHIMES[cue]) {
    const startAt = now + note.startS;
    playTone(context, master, note.frequencyHz, startAt, note);
    playTone(context, master, note.frequencyHz * OVERTONE_RATIO, startAt, {
      durationS: note.durationS,
      gain: note.gain * OVERTONE_GAIN,
    });
  }
}

// Plays the clock's chimes with the Web Audio API. The audio context is
// made on the first unlock, from a tap.
export function createChimePlayer(): ChimePlayer {
  let context: AudioContext | null = null;

  const isUnlocked = (): boolean => context?.state === "running";

  return {
    isUnlocked,
    unlock: async () => {
      const Context = audioContextClass();
      if (!Context) return false;
      context ??= new Context();
      try {
        await context.resume();
      } catch {
        return false;
      }
      return isUnlocked();
    },
    play: (cue) => {
      if (!context || !isUnlocked()) return;
      if (process.env.NODE_ENV === "development") {
        // Lets the click-through check chimes without hearing them.
        console.debug("[clock-sound]", cue);
      }
      playChime(context, cue);
    },
  };
}
