"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface ScrollContextType {
  headerTranslateY: number;
  navTranslateY: number;
  headerHeight: number;
  navHeight: number;
}

const ScrollContext = createContext<ScrollContextType>({
  headerTranslateY: 0,
  navTranslateY: 0,
  headerHeight: 0,
  navHeight: 0,
});

// Read layout values from CSS variables
function getHeaderHeight() {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-height",
      ),
    ) || 0
  );
}

function getNavHeight() {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--nav-height",
      ),
    ) || 0
  );
}

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [headerTranslateY, setHeaderTranslateY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navTranslateY, setNavTranslateY] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  const mainContainerRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);

  // Current rendered positions
  const currentHeaderY = useRef(0);
  const currentNavY = useRef(0);

  // Target positions (smoothed toward)
  const targetHeaderY = useRef(0);
  const targetNavY = useRef(0);

  const animating = useRef(false);
  const isInputFocused = useRef(false);
  const isTouching = useRef(false);

  const SMOOTHING = 0.21; // 0.12 = floaty, 0.18 = iOS-like, 0.25 = snappy

  // 🔹 Track input focus state
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        isInputFocused.current = true;
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        isInputFocused.current = false;

        // Reset header and nav to visible when keyboard closes
        currentHeaderY.current = 0;
        currentNavY.current = 0;
        targetHeaderY.current = 0;
        targetNavY.current = 0;

        setHeaderTranslateY(0);
        setNavTranslateY(0);

        // Update lastScrollY to current position
        const el = mainContainerRef.current;
        if (el) {
          lastScrollY.current = el.scrollTop;
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // 🔹 Measure header + nav and store in CSS variables (robust across routes)
  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    const tryAttach = () => {
      if (cancelled) return;

      const header = document.getElementById("page-header-wrapper");
      const nav = document.getElementById("mobile-nav");

      if (!header || !nav) {
        requestAnimationFrame(tryAttach);
        return;
      }

      const update = () => {
        document.documentElement.style.setProperty(
          "--header-height",
          `${header.offsetHeight}px`,
        );
        setHeaderHeight(header.offsetHeight);
        document.documentElement.style.setProperty(
          "--nav-height",
          `${nav.offsetHeight}px`,
        );
        setNavHeight(nav.offsetHeight);
      };

      update();

      ro = new ResizeObserver(update);
      ro.observe(header);
      ro.observe(nav);

      window.addEventListener("resize", update);
      window.addEventListener("orientationchange", update);
    };

    tryAttach();

    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, [pathname]);

  // 🔹 Rebind scroll container on route change
  useEffect(() => {
    let cancelled = false;

    const tryAttach = () => {
      if (cancelled) return;

      const el = document.getElementById("main-wrapper");
      if (!el) {
        requestAnimationFrame(tryAttach);
        return;
      }

      mainContainerRef.current = el;

      lastScrollY.current = el.scrollTop;

      // Reset everything
      currentHeaderY.current = 0;
      currentNavY.current = 0;
      targetHeaderY.current = 0;
      targetNavY.current = 0;

      setHeaderTranslateY(0);
      setNavTranslateY(0);
    };

    tryAttach();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // 🔹 Scroll handler
  useEffect(() => {
    const el = mainContainerRef.current;
    if (!el) return;

    const animate = () => {
      // LERP current -> target
      currentHeaderY.current +=
        (targetHeaderY.current - currentHeaderY.current) * SMOOTHING;

      currentNavY.current +=
        (targetNavY.current - currentNavY.current) * SMOOTHING;

      setHeaderTranslateY(currentHeaderY.current);
      setNavTranslateY(currentNavY.current);

      if (
        Math.abs(targetHeaderY.current - currentHeaderY.current) > 0.1 ||
        Math.abs(targetNavY.current - currentNavY.current) > 0.1
      ) {
        requestAnimationFrame(animate);
      } else {
        // Snap to exact target
        currentHeaderY.current = targetHeaderY.current;
        currentNavY.current = targetNavY.current;
        setHeaderTranslateY(currentHeaderY.current);
        setNavTranslateY(currentNavY.current);
        animating.current = false;
      }
    };

    const snapOnRelease = () => {
      const headerHeight = getHeaderHeight();
      const navHeight = getNavHeight();
      if (!headerHeight || !navHeight) return;

      // Calculate visibility percentages for both header and nav
      // Header: translateY ranges from 0 (visible) to -headerHeight (hidden)
      const headerVisibleAmount = headerHeight + targetHeaderY.current;
      const headerVisiblePercentage = headerVisibleAmount / headerHeight;

      // Nav: translateY ranges from 0 (visible) to navHeight (hidden)
      const navVisibleAmount = navHeight - targetNavY.current;
      const navVisiblePercentage = navVisibleAmount / navHeight;

      // Use the minimum of the two percentages to determine overall visibility
      // This ensures both are synchronized and considers the slower-to-appear element
      const overallVisibility = Math.min(
        headerVisiblePercentage,
        navVisiblePercentage,
      );

      const VISIBILITY_THRESHOLD = 0.99; // Both must be 99% visible to stay shown

      // Only keep both visible if BOTH are fully visible
      if (overallVisibility >= VISIBILITY_THRESHOLD) {
        targetHeaderY.current = 0;
        targetNavY.current = 0;
      } else {
        targetHeaderY.current = -headerHeight;
        targetNavY.current = navHeight;
      }

      // Start animation if not already running
      if (!animating.current) {
        animating.current = true;
        requestAnimationFrame(animate);
      }
    };

    const handleScroll = () => {
      // Skip scroll handling if an input is focused
      if (isInputFocused.current) {
        lastScrollY.current = el.scrollTop;
        return;
      }

      const headerHeight = getHeaderHeight();
      const navHeight = getNavHeight();
      if (!headerHeight || !navHeight) return;

      const currentScrollY = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      const delta = currentScrollY - lastScrollY.current;

      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 5;

      // Compute TARGET positions
      if (currentScrollY < 10) {
        targetHeaderY.current = 0;
        targetNavY.current = 0;
      } else if (isAtBottom) {
        targetHeaderY.current = -headerHeight;
        targetNavY.current = navHeight;
      } else {
        const damped = delta * 0.9;

        // Apply the same damped delta to both, scaled to their respective heights
        // This keeps them visually synchronized despite different heights
        const headerDelta = damped;
        const navDelta = damped;

        targetHeaderY.current = Math.max(
          -headerHeight,
          Math.min(0, targetHeaderY.current - headerDelta),
        );

        targetNavY.current = Math.max(
          0,
          Math.min(navHeight, targetNavY.current + navDelta),
        );
      }

      lastScrollY.current = currentScrollY;

      if (!animating.current) {
        animating.current = true;
        requestAnimationFrame(animate);
      }
    };

    const handleTouchStart = () => {
      isTouching.current = true;
    };

    const handleTouchEnd = () => {
      isTouching.current = false;
      snapOnRelease();
    };

    // Also handle mouse for desktop testing
    const handleMouseDown = () => {
      isTouching.current = true;
    };

    const handleMouseUp = () => {
      isTouching.current = false;
      snapOnRelease();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pathname]);

  return (
    <ScrollContext.Provider
      value={{
        headerTranslateY,
        navTranslateY,
        headerHeight,
        navHeight,
      }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollState() {
  return useContext(ScrollContext);
}
