import { describe, expect, it } from "vitest";
import { describeClock } from "@/features/clock/lib/display";
import {
  MAX_TICK_GAP_MS,
  planSoundCue,
  type SoundTick,
  soundTickOf,
} from "@/features/clock/lib/sounds";
import { makeClock } from "@/features/clock/lib/test-fixtures";

const TICK_MS = 250;
const SECOND = 1000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

// A running tick on level 1 with this much time left, at this time.
function tick(change: Partial<SoundTick> = {}): SoundTick {
  return {
    status: "running",
    levelIndex: 0,
    remainingMs: 20 * 60 * SECOND,
    isBreak: false,
    nowMs: START_MS,
    ...change,
  };
}

// The tick after `previous`, one display tick later.
function next(previous: SoundTick, change: Partial<SoundTick>): SoundTick {
  return { ...previous, nowMs: previous.nowMs + TICK_MS, ...change };
}

describe("planSoundCue: the one-minute warning", () => {
  it("stays quiet before the last minute", () => {
    const before = tick({ remainingMs: 61_000 });
    expect(planSoundCue(before, next(before, { remainingMs: 60_750 }))).toBe(
      null,
    );
  });

  it("warns when the time left crosses one minute", () => {
    const before = tick({ remainingMs: 60_250 });
    expect(planSoundCue(before, next(before, { remainingMs: 59_750 }))).toBe(
      "warning",
    );
  });

  it("warns at exactly one minute left", () => {
    const before = tick({ remainingMs: 60_200 });
    expect(planSoundCue(before, next(before, { remainingMs: 60_000 }))).toBe(
      "warning",
    );
  });

  it("warns once", () => {
    const before = tick({ remainingMs: 59_750 });
    expect(planSoundCue(before, next(before, { remainingMs: 59_500 }))).toBe(
      null,
    );
  });

  it("warns on a break too", () => {
    const before = tick({ levelIndex: 4, isBreak: true, remainingMs: 60_100 });
    expect(planSoundCue(before, next(before, { remainingMs: 59_850 }))).toBe(
      "warning",
    );
  });

  it("warns again after time is added and runs down again", () => {
    // +1 minute at 30 s left takes it to 90 s; later it crosses again.
    const later = tick({ remainingMs: 60_100 });
    expect(planSoundCue(later, next(later, { remainingMs: 59_850 }))).toBe(
      "warning",
    );
  });

  it("warns when removing a minute takes the time under one minute", () => {
    // −1 minute at 1:30 left lands on 0:30: under a minute, so it warns.
    const before = tick({ remainingMs: 90_000 });
    expect(planSoundCue(before, next(before, { remainingMs: 30_000 }))).toBe(
      "warning",
    );
  });

  it("stays quiet when the last level runs out", () => {
    const before = tick({ levelIndex: 18, remainingMs: 200 });
    expect(planSoundCue(before, next(before, { remainingMs: 0 }))).toBe(null);
  });
});

describe("planSoundCue: level changes", () => {
  it("chimes for a new level", () => {
    const before = tick({ levelIndex: 0, remainingMs: 100 });
    expect(
      planSoundCue(
        before,
        next(before, { levelIndex: 1, remainingMs: 1_199_850 }),
      ),
    ).toBe("level");
  });

  it("chimes differently for a break", () => {
    const before = tick({ levelIndex: 3, remainingMs: 100 });
    expect(
      planSoundCue(
        before,
        next(before, { levelIndex: 4, isBreak: true, remainingMs: 599_850 }),
      ),
    ).toBe("break");
  });

  it("chimes for the level after a break", () => {
    const before = tick({ levelIndex: 4, isBreak: true, remainingMs: 100 });
    expect(
      planSoundCue(
        before,
        next(before, { levelIndex: 5, isBreak: false, remainingMs: 1_199_850 }),
      ),
    ).toBe("level");
  });

  it("chimes when the admin moves the level while running", () => {
    const before = tick({ levelIndex: 2, remainingMs: 300_000 });
    expect(
      planSoundCue(
        before,
        next(before, { levelIndex: 3, remainingMs: 1_200_000 }),
      ),
    ).toBe("level");
    expect(
      planSoundCue(
        before,
        next(before, { levelIndex: 1, remainingMs: 1_200_000 }),
      ),
    ).toBe("level");
  });
});

describe("planSoundCue: silence", () => {
  it("stays quiet without a previous tick", () => {
    expect(planSoundCue(null, tick({ remainingMs: 59_000 }))).toBe(null);
  });

  it("stays quiet when the clock starts", () => {
    const setup = tick({ status: "setup" });
    expect(planSoundCue(setup, next(setup, { status: "running" }))).toBe(null);
  });

  it("stays quiet on pause and resume", () => {
    const running = tick({ remainingMs: 300_000 });
    const paused = next(running, { status: "paused" });
    expect(planSoundCue(running, paused)).toBe(null);
    expect(planSoundCue(paused, next(paused, { status: "running" }))).toBe(
      null,
    );
  });

  it("stays quiet when the level changes while paused", () => {
    const paused = tick({ status: "paused", levelIndex: 2 });
    expect(planSoundCue(paused, next(paused, { levelIndex: 3 }))).toBe(null);
  });

  it("stays quiet across a long gap, such as a tab that slept", () => {
    const before = tick({ levelIndex: 0, remainingMs: 100 });
    const woke = {
      ...before,
      levelIndex: 3,
      remainingMs: 59_000,
      nowMs: before.nowMs + MAX_TICK_GAP_MS + 1,
    };
    expect(planSoundCue(before, woke)).toBe(null);
  });

  it("still chimes at exactly the longest allowed gap", () => {
    const before = tick({ levelIndex: 0, remainingMs: 100 });
    const later = {
      ...before,
      levelIndex: 1,
      remainingMs: 1_198_000,
      nowMs: before.nowMs + MAX_TICK_GAP_MS,
    };
    expect(planSoundCue(before, later)).toBe("level");
  });
});

describe("soundTickOf", () => {
  it("takes the tick from what the display shows", () => {
    const clock = makeClock({
      status: "running",
      level_index: 4,
      level_started_at: new Date(START_MS).toISOString(),
    });
    const nowMs = START_MS + 9 * 60 * SECOND;
    expect(soundTickOf(describeClock(clock, nowMs), nowMs)).toEqual({
      status: "running",
      levelIndex: 4,
      remainingMs: 60 * SECOND,
      isBreak: true,
      nowMs,
    });
  });
});
