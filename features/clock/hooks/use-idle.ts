"use client";

import { useEffect, useState } from "react";

// What counts as someone using the screen.
const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown"] as const;
const DEFAULT_IDLE_MS = 3000;

// True once nobody has moved the mouse, touched the screen or pressed a
// key for delayMs, while isActive. Always false while isActive is false.
export function useIdle(isActive: boolean, delayMs = DEFAULT_IDLE_MS): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    let timer = setTimeout(() => setIsIdle(true), delayMs);
    const onActivity = (): void => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), delayMs);
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity),
    );
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity),
      );
      // Start awake the next time it's active.
      setIsIdle(false);
    };
  }, [isActive, delayMs]);

  return isActive && isIdle;
}
