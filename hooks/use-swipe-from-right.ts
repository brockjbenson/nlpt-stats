"use client";

import { useEffect, useRef } from "react";

const HORIZONTAL_LOCK_PX = 10;
// Release velocity is measured over the last stretch of the drag only, so a
// finger that stops before lifting reads as ~0 instead of the earlier speed.
const VELOCITY_WINDOW_MS = 100;

type SwipeMode = "open" | "close";

// Right-side version of the oxbros useSwipeFromLeft hook. Tracks a
// horizontal drag for a drawer that slides in from the right. Two modes:
//   - "open":  closed → open. Touch must start within `startWithinPx` of
//              the right edge. Leftward drag reveals the drawer.
//   - "close": open → closed. Touch can start anywhere. Rightward drag
//              pushes the drawer back off screen.
//
// `canStart` lets the caller veto a touch before it is tracked (for example
// one that starts on a carousel or a table that scrolls sideways).
//
// While the gesture is judged horizontal in the right direction,
// preventDefault on touchmove blocks the page from scrolling (and iOS
// Safari's edge swipe) so we own this surface.
//
// Unlike the oxbros hook this doesn't hold the offset in React state: it
// reports every move through `onDrag` so the caller can drive an animation
// value directly without re-rendering, and reports release velocity so the
// caller can honor flicks.
export function useSwipeFromRight({
  enabled,
  mode,
  getWidth,
  startWithinPx,
  canStart,
  onDrag,
  onRelease,
}: {
  enabled: boolean;
  mode: SwipeMode;
  // Drawer width in px, read when the gesture locks in.
  getWidth: () => number;
  startWithinPx?: number;
  canStart?: (e: TouchEvent) => boolean;
  // Every move once locked. `offset` is how many px of the drawer are
  // showing (0..width). Runs inside touchmove, so it is also the place for
  // haptics: iOS allows them there but not from touchend on a
  // preventDefault'd gesture.
  onDrag: (offset: number, width: number) => void;
  // Locked gesture ended. `velocity` is px/s along offset: positive means
  // moving toward open, negative toward closed.
  onRelease: (offset: number, width: number, velocity: number) => void;
}): void {
  const getWidthRef = useRef(getWidth);
  const startWithinRef = useRef(startWithinPx);
  const canStartRef = useRef(canStart);
  const onDragRef = useRef(onDrag);
  const onReleaseRef = useRef(onRelease);
  useEffect(() => {
    getWidthRef.current = getWidth;
    startWithinRef.current = startWithinPx;
    canStartRef.current = canStart;
    onDragRef.current = onDrag;
    onReleaseRef.current = onRelease;
  });

  useEffect(() => {
    if (!enabled) return;

    let startX: number | null = null;
    let startY: number | null = null;
    let isHorizontal = false;
    let width = 0;
    let lastOffset = 0;
    let samples: { t: number; offset: number }[] = [];

    function clearTouch() {
      startX = null;
      startY = null;
      isHorizontal = false;
      width = 0;
      lastOffset = 0;
      samples = [];
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        clearTouch();
        return;
      }
      const t = e.touches[0];
      if (!t) return;
      if (
        mode === "open" &&
        startWithinRef.current !== undefined &&
        window.innerWidth - t.clientX > startWithinRef.current
      ) {
        return;
      }
      if (canStartRef.current && !canStartRef.current(e)) return;
      clearTouch();
      startX = t.clientX;
      startY = t.clientY;
    }

    function onMove(e: TouchEvent) {
      if (startX === null || startY === null) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Lock direction: horizontal AND in the right direction for the mode.
      if (
        !isHorizontal &&
        Math.abs(dx) > Math.abs(dy) &&
        Math.abs(dx) > HORIZONTAL_LOCK_PX
      ) {
        const correctDirection =
          (mode === "open" && dx < 0) || (mode === "close" && dx > 0);
        if (!correctDirection) {
          clearTouch();
          return;
        }
        isHorizontal = true;
        width = getWidthRef.current();
      }

      if (!isHorizontal || width <= 0) return;
      e.preventDefault();
      const offset =
        mode === "open"
          ? Math.max(0, Math.min(width, -dx))
          : Math.max(0, Math.min(width, width - dx));
      const now = performance.now();
      lastOffset = offset;
      samples.push({ t: now, offset });
      while (samples.length > 2 && now - samples[0].t > VELOCITY_WINDOW_MS) {
        samples.shift();
      }
      onDragRef.current(offset, width);
    }

    function finish() {
      if (isHorizontal && width > 0) {
        const now = performance.now();
        const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
        const first = recent[0];
        const last = recent[recent.length - 1];
        const velocity =
          first && last && last.t > first.t
            ? ((last.offset - first.offset) / (last.t - first.t)) * 1000
            : 0;
        onReleaseRef.current(lastOffset, width, velocity);
      }
      clearTouch();
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", finish);
    document.addEventListener("touchcancel", finish);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", finish);
    };
  }, [enabled, mode]);
}
