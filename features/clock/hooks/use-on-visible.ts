"use client";

import { useEffect } from "react";

// Calls callback whenever the tab becomes visible again, such as a phone
// waking up.
export function useOnVisible(callback: () => void): void {
  useEffect(() => {
    const onChange = (): void => {
      if (document.visibilityState === "visible") callback();
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [callback]);
}
