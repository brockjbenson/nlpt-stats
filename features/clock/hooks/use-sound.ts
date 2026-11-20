"use client";

import type { SoundCue } from "@/features/clock/lib/sounds";
import { createChimePlayer } from "@/features/clock/sounds/chime-player";
import { useCallback, useState, useSyncExternalStore } from "react";

// Where the viewer's sound choice is remembered, per browser.
const STORAGE_KEY = "nlpt-clock-sound";
const ON = "on";

// The choice for this page, used when storage is blocked (some private
// windows, blocked site data).
let isOnInMemory = false;

// The saved choice; off when it was never set.
function readSavedOn(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === ON;
  } catch {
    return isOnInMemory;
  }
}

// Components showing the choice, told when it changes in this tab.
const listeners = new Set<() => void>();

function saveOn(isOn: boolean): void {
  isOnInMemory = isOn;
  try {
    if (isOn) window.localStorage.setItem(STORAGE_KEY, ON);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is blocked: the choice holds for this page only.
  }
  listeners.forEach((listener) => listener());
}

// Follows the saved choice in this tab and others (the storage event).
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// The server can't read the choice, so its HTML (and the first paint)
// has sound off.
function serverSnapshot(): boolean {
  return false;
}

export type ClockSound = {
  // The viewer wants sound.
  isOn: boolean;
  // Sound is on but the browser hasn't allowed it yet: every fresh page
  // load needs a tap first.
  needsTap: boolean;
  // Call these from a tap: browsers only start audio from one.
  turnOn: () => void;
  unlockFromTap: () => void;
  turnOff: () => void;
  // Plays a chime when sound is on and allowed.
  play: (cue: SoundCue) => void;
};

// The display's sound: the viewer's on/off choice (remembered), and the
// chime player, unlocked by a tap.
export function useSound(): ClockSound {
  const [player] = useState(createChimePlayer);
  const isOn = useSyncExternalStore(subscribe, readSavedOn, serverSnapshot);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlockFromTap = useCallback((): void => {
    void player.unlock().then(setIsUnlocked);
  }, [player]);

  const turnOn = useCallback((): void => {
    unlockFromTap();
    saveOn(true);
  }, [unlockFromTap]);

  const turnOff = useCallback((): void => {
    saveOn(false);
  }, []);

  const play = useCallback(
    (cue: SoundCue): void => {
      if (isOn) player.play(cue);
    },
    [isOn, player],
  );

  return {
    isOn,
    needsTap: isOn && !isUnlocked,
    turnOn,
    unlockFromTap,
    turnOff,
    play,
  };
}
