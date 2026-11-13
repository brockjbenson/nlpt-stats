"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Keep scrolling down this far (px) before the bar collapses...
const MINIMIZE_AFTER_PX = 24;
// ...or up this far before it expands again.
const EXPAND_AFTER_PX = 16;
// Never collapsed this close to the top, or on pages shorter than this.
const MIN_SCROLL_Y = 80;
// Always expanded above this.
const TOP_EXPAND_Y = 40;

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable)
  );
}

// iOS 26 tab bar minimize behavior: collapse while scrolling down, expand when
// scrolling up, near the top, or on a new page. Returns:
//   - minimized
//   - setMinimized, so the minimized capsule can expand the bar when tapped
//   - ignoreScrollFor(ms), so a scroll we start ourselves isn't read as the
//     user scrolling (and doesn't collapse the bar again)
export function useMinimizeOnScroll(enabled: boolean) {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMinimized(false);
  }

  const lastY = useRef(0);
  const lastHeight = useRef(0);
  const downTravel = useRef(0);
  const upTravel = useRef(0);
  const ignoreUntil = useRef(0);

  const ignoreScrollFor = useCallback((ms: number) => {
    ignoreUntil.current = performance.now() + ms;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    lastY.current = window.scrollY;
    lastHeight.current = document.documentElement.scrollHeight;
    downTravel.current = 0;
    upTravel.current = 0;
    // The tab bar only exists below the md breakpoint.
    const mobile = window.matchMedia("(max-width: 767.98px)");

    function onScroll() {
      if (!mobile.matches) {
        setMinimized(false);
        return;
      }
      const height = document.documentElement.scrollHeight;
      const maxY = height - window.innerHeight;
      const y = window.scrollY;
      // Safari's rubber-band bounce past either end isn't real scrolling.
      if (y < 0 || y > maxY) return;
      // Not the user: the page changed height (e.g. the accessory's space
      // being added or removed, which can nudge the scroll position), or we
      // scrolled programmatically. Just resync.
      if (
        height !== lastHeight.current ||
        performance.now() < ignoreUntil.current
      ) {
        lastHeight.current = height;
        lastY.current = y;
        downTravel.current = 0;
        upTravel.current = 0;
        return;
      }
      const delta = y - lastY.current;
      lastY.current = y;
      // Leave it alone while the keyboard is up.
      if (isTyping()) return;

      if (maxY < MIN_SCROLL_Y || y < TOP_EXPAND_Y) {
        downTravel.current = 0;
        upTravel.current = 0;
        setMinimized(false);
      } else if (delta > 0) {
        downTravel.current += delta;
        upTravel.current = 0;
        if (downTravel.current >= MINIMIZE_AFTER_PX && y > MIN_SCROLL_Y) {
          setMinimized(true);
        }
      } else if (delta < 0) {
        upTravel.current -= delta;
        downTravel.current = 0;
        if (upTravel.current >= EXPAND_AFTER_PX) setMinimized(false);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, pathname]);

  return [enabled && minimized, setMinimized, ignoreScrollFor] as const;
}
