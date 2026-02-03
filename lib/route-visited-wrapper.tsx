"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface RouteVisitTrackerProps {
  children: React.ReactNode;
  routesToTrack: string[];
  storageKey?: string;
}

export function RouteVisitTracker({
  children,
  routesToTrack,
  storageKey = "nlpt-visited-routes",
}: RouteVisitTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Check if current route should be tracked
    const shouldTrack = routesToTrack.some((route) => {
      // Handle routes with query params by comparing base path
      const basePath = pathname.split("?")[0];
      return basePath === route;
    });

    if (shouldTrack) {
      markRouteAsVisited(pathname, storageKey);
    }
  }, [pathname, routesToTrack, storageKey]);

  return <>{children}</>;
}

// Utility function to mark a route as visited
function markRouteAsVisited(route: string, storageKey: string) {
  if (typeof window === "undefined") return;

  try {
    const basePath = route.split("?")[0];
    const stored = localStorage.getItem(storageKey);
    const visitedRoutes: string[] = stored ? JSON.parse(stored) : [];

    if (!visitedRoutes.includes(basePath)) {
      visitedRoutes.push(basePath);
      localStorage.setItem(storageKey, JSON.stringify(visitedRoutes));

      // Dispatch custom event so other components can update
      window.dispatchEvent(new Event("visited-routes-updated"));
    }
  } catch (error) {
    console.error("Error marking route as visited:", error);
  }
}

// Utility functions for use anywhere in your app
export function getVisitedRoutes(storageKey = "nlpt-visited-routes"): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error getting visited routes:", error);
    return [];
  }
}

export function hasVisitedRoute(
  route: string,
  storageKey = "nlpt-visited-routes",
): boolean {
  const basePath = route.split("?")[0];
  const visitedRoutes = getVisitedRoutes(storageKey);
  return visitedRoutes.includes(basePath);
}

export function clearVisitedRoutes(storageKey = "nlpt-visited-routes"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("visited-routes-updated"));
  } catch (error) {
    console.error("Error clearing visited routes:", error);
  }
}

export function clearSpecificRoute(
  route: string,
  storageKey = "nlpt-visited-routes",
): void {
  if (typeof window === "undefined") return;
  try {
    const basePath = route.split("?")[0];
    const visitedRoutes = getVisitedRoutes(storageKey);
    const filtered = visitedRoutes.filter((r) => r !== basePath);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    window.dispatchEvent(new Event("visited-routes-updated"));
  } catch (error) {
    console.error("Error clearing specific route:", error);
  }
}
