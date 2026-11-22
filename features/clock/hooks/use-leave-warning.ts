"use client";

import { useEffect } from "react";

// Warns before closing or reloading the tab with unsaved changes.
export function useLeaveWarning(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
}
