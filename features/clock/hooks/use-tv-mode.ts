"use client";

import { useWakeLock } from "@/features/clock/hooks/use-wake-lock";
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

// TV mode for the display: fullscreen, and the screen kept awake so the TV
// or phone doesn't sleep. Fullscreen is skipped where the browser can't do
// it (an iPhone can't make a page fullscreen). Leaving fullscreen (Esc)
// ends TV mode.
export function useTvMode(): TvMode {
  const [isTvMode, setIsTvMode] = useState(false);
  const wakeLock = useWakeLock();
  // Whether this TV mode went fullscreen, so leaving fullscreen ends it.
  const enteredFullscreen = useRef(false);

  const exit = useCallback((): void => {
    setIsTvMode(false);
    wakeLock.release();
    enteredFullscreen.current = false;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [wakeLock]);

  const enter = useCallback((): void => {
    setIsTvMode(true);
    if (canGoFullscreen() && !document.fullscreenElement) {
      enteredFullscreen.current = true;
      void document.documentElement.requestFullscreen().catch(() => {
        enteredFullscreen.current = false;
      });
    }
    wakeLock.hold();
  }, [wakeLock]);

  // Esc (or the browser) leaving fullscreen ends TV mode.
  useEffect(() => {
    const onChange = (): void => {
      if (!document.fullscreenElement && enteredFullscreen.current) exit();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [exit]);

  return { isTvMode, enter, exit };
}
