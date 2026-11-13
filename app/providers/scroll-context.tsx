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
  headerHeight: number;
  // Height of the bottom tab bar's area (#mobile-nav), for content that has
  // to sit above it. The bar itself minimizes on scroll (see
  // components/bottom-tabs) rather than sliding away.
  navHeight: number;
}

const ScrollContext = createContext<ScrollContextType>({
  headerTranslateY: 0,
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

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [headerTranslateY, setHeaderTranslateY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // 🔹 Reset header position on route change (during render, not in an effect)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setHeaderTranslateY(0);
  }

  const lastScrollY = useRef(0);

  // Current rendered position
  const currentHeaderY = useRef(0);

  // Target position (smoothed toward)
  const targetHeaderY = useRef(0);

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

        // Reset header to visible when keyboard closes
        currentHeaderY.current = 0;
        targetHeaderY.current = 0;

        setHeaderTranslateY(0);

        lastScrollY.current = window.scrollY;
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

  // 🔹 Reset scroll tracking refs on route change
  useEffect(() => {
    lastScrollY.current = window.scrollY;

    currentHeaderY.current = 0;
    targetHeaderY.current = 0;
  }, [pathname]);

  // 🔹 Scroll handler
  useEffect(() => {
    const animate = () => {
      // LERP current -> target
      currentHeaderY.current +=
        (targetHeaderY.current - currentHeaderY.current) * SMOOTHING;

      setHeaderTranslateY(currentHeaderY.current);

      if (Math.abs(targetHeaderY.current - currentHeaderY.current) > 0.1) {
        requestAnimationFrame(animate);
      } else {
        // Snap to exact target
        currentHeaderY.current = targetHeaderY.current;
        setHeaderTranslateY(currentHeaderY.current);
        animating.current = false;
      }
    };

    const snapOnRelease = () => {
      const headerHeight = getHeaderHeight();
      if (!headerHeight) return;

      // Header: translateY ranges from 0 (visible) to -headerHeight (hidden)
      const headerVisibleAmount = headerHeight + targetHeaderY.current;
      const headerVisiblePercentage = headerVisibleAmount / headerHeight;

      const VISIBILITY_THRESHOLD = 0.99; // Must be 99% visible to stay shown

      // Only keep it shown if it's fully visible; otherwise finish hiding it
      if (headerVisiblePercentage >= VISIBILITY_THRESHOLD) {
        targetHeaderY.current = 0;
      } else {
        targetHeaderY.current = -headerHeight;
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
        lastScrollY.current = window.scrollY;
        return;
      }

      const headerHeight = getHeaderHeight();
      if (!headerHeight) return;

      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const delta = currentScrollY - lastScrollY.current;

      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 5;

      // Compute TARGET position
      if (currentScrollY < 10) {
        targetHeaderY.current = 0;
      } else if (isAtBottom) {
        targetHeaderY.current = -headerHeight;
      } else {
        const damped = delta * 0.9;

        targetHeaderY.current = Math.max(
          -headerHeight,
          Math.min(0, targetHeaderY.current - damped),
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pathname]);

  return (
    <ScrollContext.Provider
      value={{
        headerTranslateY,
        headerHeight,
        navHeight,
      }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollState() {
  return useContext(ScrollContext);
}
