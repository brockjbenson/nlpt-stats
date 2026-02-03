"use client";

import { getVisitedRoutes } from "@/lib/route-visited-wrapper";
import { useEffect, useState } from "react";

const ROUTES_TO_TRACK = ["/compare"];
const STORAGE_KEY = "nlpt-visited-routes";

export function MenuNotificationDot() {
  const [hasUnvisited, setHasUnvisited] = useState(false);

  useEffect(() => {
    // Check on mount
    const checkUnvisited = () => {
      const visitedRoutes = getVisitedRoutes(STORAGE_KEY);
      const hasUnvisitedRoutes = ROUTES_TO_TRACK.some(
        (route) => !visitedRoutes.includes(route),
      );
      setHasUnvisited(hasUnvisitedRoutes);
    };

    checkUnvisited();

    // Listen for storage changes (in case it's updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        checkUnvisited();
      }
    };

    // Listen for custom events from the same tab
    const handleCustomUpdate = () => checkUnvisited();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("visited-routes-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("visited-routes-updated", handleCustomUpdate);
    };
  }, []); // Empty dependency array - only set up listeners once

  if (!hasUnvisited) return null;

  return (
    <span className="absolute top-0 right-5 text-[8px] px-1 py-0.5 font-bold text-black bg-primary rounded-full">
      NEW
    </span>
  );
}
