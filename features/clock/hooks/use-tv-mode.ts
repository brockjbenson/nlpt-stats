"use client";

import { useOnVisible } from "@/features/clock/hooks/use-on-visible";
import { useCallback, useEffect, useRef, useState } from "react";

export type TvMode = {
  isTvMode: boolean;
  // Call from a tap: browsers only allow fullscreen from one.
  enter: () => void;
  exit: () => void;
};

function canGoFullscreen(): boolean {
  return document.fullscreenEnabled === true;
}

// TV mode for the display: fullscreen, and a screen wake lock so the TV or
// phone doesn't sleep. Either is skipped where the browser can't do it (an
// iPhone can't make a page fullscreen; some browsers have no wake lock).
// Leaving fullscreen (Esc) ends TV mode. The browser drops the wake lock
// when the tab is hidden, so it's taken again when the tab comes back.
export function useTvMode(): TvMode {
  const [isTvMode, setIsTvMode] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  // Whether this TV mode went fullscreen, so leaving fullscreen ends it.
  const enteredFullscreen = useRef(false);
  // Read inside async callbacks, which can finish after TV mode ends.
  const isOn = useRef(false);

  const holdScreenAwake = useCallback(async (): Promise<void> => {
    if (!("wakeLock" in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      // TV mode ended while the request was pending: let the screen sleep.
      if (!isOn.current) {
        void lock.release().catch(() => undefined);
        return;
      }
      wakeLock.current = lock;
    } catch {
      // Refused (low battery, or the tab isn't visible): carry on without.
    }
  }, []);

  const releaseScreen = useCallback((): void => {
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  }, []);

  const exit = useCallback((): void => {
    isOn.current = false;
    setIsTvMode(false);
    releaseScreen();
    enteredFullscreen.current = false;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [releaseScreen]);

  const enter = useCallback((): void => {
    isOn.current = true;
    setIsTvMode(true);
    if (canGoFullscreen() && !document.fullscreenElement) {
      enteredFullscreen.current = true;
      void document.documentElement.requestFullscreen().catch(() => {
        enteredFullscreen.current = false;
      });
    }
    void holdScreenAwake();
  }, [holdScreenAwake]);

  // Esc (or the browser) leaving fullscreen ends TV mode.
  useEffect(() => {
    const onChange = (): void => {
      if (!document.fullscreenElement && enteredFullscreen.current) exit();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [exit]);

  // Let the screen sleep again when the display closes.
  useEffect(
    () => () => {
      isOn.current = false;
      releaseScreen();
    },
    [releaseScreen],
  );

  const reacquire = useCallback((): void => {
    if (isTvMode) void holdScreenAwake();
  }, [isTvMode, holdScreenAwake]);
  useOnVisible(reacquire);

  return { isTvMode, enter, exit };
}
