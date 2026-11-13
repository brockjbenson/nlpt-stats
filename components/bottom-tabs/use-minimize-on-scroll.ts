"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  );
}

// iOS 26 tab bar minimize behavior: collapse while scrolling down, expand when
// scrolling up, near the top, or on a new page. Returns [minimized, set] so the
// minimized capsule can expand the bar when tapped.
export function useMinimizeOnScroll(enabled: boolean) {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMinimized(false);
  }

  const lastY = useRef(0);
  const downTravel = useRef(0);
  const upTravel = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    lastY.current = window.scrollY;
    downTravel.current = 0;
    upTravel.current = 0;

    function onScroll() {
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      // Safari's rubber-band bounce past either end isn't real scrolling.
      if (y < 0 || y > maxY) return;
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

  return [enabled && minimized, setMinimized] as const;
}
