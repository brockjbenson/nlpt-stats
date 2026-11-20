"use client";

import { useOnVisible } from "@/features/clock/hooks/use-on-visible";
import { useCallback, useEffect, useMemo, useRef } from "react";

export type WakeLock = {
  // Keeps the screen awake until release(). Skipped where the browser has
  // no wake lock, or refuses one (low battery, the tab isn't visible).
  hold: () => void;
  release: () => void;
};

// A screen wake lock that's held until released. The browser drops the
// lock when the tab is hidden, so it's taken again when the tab comes back
// while held; a lock that arrives after release() is let go at once.
export function useWakeLock(): WakeLock {
  const sentinel = useRef<WakeLockSentinel | null>(null);
  // Whether the screen should be kept awake. Read by the async request,
  // which can finish after release().
  const isHeld = useRef(false);

  const request = useCallback(async (): Promise<void> => {
    if (!("wakeLock" in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!isHeld.current) {
        void lock.release().catch(() => undefined);
        return;
      }
      sentinel.current = lock;
    } catch {
      // Refused: carry on without.
    }
  }, []);

  const hold = useCallback((): void => {
    isHeld.current = true;
    void request();
  }, [request]);

  const release = useCallback((): void => {
    isHeld.current = false;
    void sentinel.current?.release().catch(() => undefined);
    sentinel.current = null;
  }, []);

  const reacquire = useCallback((): void => {
    if (isHeld.current) void request();
  }, [request]);
  useOnVisible(reacquire);

  // Let the screen sleep again when the display closes.
  useEffect(() => release, [release]);

  // Stable, so callers can depend on it.
  return useMemo(() => ({ hold, release }), [hold, release]);
}
