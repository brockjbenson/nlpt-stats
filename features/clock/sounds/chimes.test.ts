import { describe, expect, it } from "vitest";
import { CHIMES, chimeLengthS } from "@/features/clock/sounds/chimes";
import type { SoundCue } from "@/features/clock/lib/sounds";

const CUES: SoundCue[] = ["warning", "level", "break"];
// A chime must finish well before the next one could start.
const MAX_LENGTH_S = 2;

describe("CHIMES", () => {
  it.each(CUES)("%s has notes", (cue) => {
    expect(CHIMES[cue].length).toBeGreaterThan(0);
  });

  it.each(CUES)("%s has playable notes", (cue) => {
    for (const note of CHIMES[cue]) {
      expect(note.frequencyHz).toBeGreaterThan(0);
      expect(note.durationS).toBeGreaterThan(0);
      expect(note.startS).toBeGreaterThanOrEqual(0);
      expect(note.gain).toBeGreaterThan(0);
      expect(note.gain).toBeLessThanOrEqual(1);
    }
  });

  it.each(CUES)("%s is short", (cue) => {
    expect(chimeLengthS(cue)).toBeLessThan(MAX_LENGTH_S);
  });

  it("makes the break chime softer than the level chime", () => {
    const loudest = (cue: SoundCue): number =>
      Math.max(...CHIMES[cue].map(({ gain }) => gain));
    expect(loudest("break")).toBeLessThan(loudest("level"));
  });

  it("makes each chime sound different", () => {
    const shape = (cue: SoundCue): string =>
      CHIMES[cue].map(({ frequencyHz }) => frequencyHz).join(",");
    expect(new Set(CUES.map(shape)).size).toBe(CUES.length);
  });
});

describe("chimeLengthS", () => {
  it("is when the last note ends", () => {
    const ends = CHIMES.level.map(
      ({ startS, durationS }) => startS + durationS,
    );
    expect(chimeLengthS("level")).toBe(Math.max(...ends));
  });
});
