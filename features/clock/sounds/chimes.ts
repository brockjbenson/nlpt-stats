import type { SoundCue } from "@/features/clock/lib/sounds";

// One note of a chime, played as a soft bell tone.
export type ChimeNote = {
  frequencyHz: number;
  // When the note starts, from the start of the chime.
  startS: number;
  // How long it rings before fading out.
  durationS: number;
  // Peak volume, 0–1.
  gain: number;
};

// Note frequencies (equal temperament, A4 = 440 Hz).
const C4 = 261.63;
const G4 = 392.0;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;

// The display's chimes. Tuned by ear; each is under two seconds.
// - warning: two quick high pips, "a minute left"
// - level: a rising major chord, "new blinds"
// - break: two soft falling notes, "take a break"
export const CHIMES: Record<SoundCue, ChimeNote[]> = {
  warning: [
    { frequencyHz: A5, startS: 0, durationS: 0.2, gain: 0.5 },
    { frequencyHz: A5, startS: 0.28, durationS: 0.35, gain: 0.5 },
  ],
  level: [
    { frequencyHz: C5, startS: 0, durationS: 0.3, gain: 0.55 },
    { frequencyHz: E5, startS: 0.16, durationS: 0.3, gain: 0.55 },
    { frequencyHz: G5, startS: 0.32, durationS: 0.9, gain: 0.6 },
  ],
  break: [
    { frequencyHz: G4, startS: 0, durationS: 0.6, gain: 0.4 },
    { frequencyHz: C4, startS: 0.4, durationS: 1.1, gain: 0.4 },
  ],
};

// How long a chime lasts: when its last note ends.
export function chimeLengthS(cue: SoundCue): number {
  return Math.max(
    ...CHIMES[cue].map(({ startS, durationS }) => startS + durationS),
  );
}
