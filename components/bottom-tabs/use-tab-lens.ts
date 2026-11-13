"use client";

import { useEffect, useRef, type RefObject } from "react";
import { haptic } from "@/lib/haptics";

// Sideways travel (px) before a press on the bar becomes a lens drag.
const DRAG_START_PX = 6;
// The pill track sits this far inside the bar's left edge.
export const BAR_INSET_PX = 4;

// iOS 26 press-and-slide on the tab bar. Once a press moves sideways, the
// selection pill lifts into a lens and follows the finger 1:1 across the bar;
// the tab under it highlights (with a haptic tick on each new tab) and is
// opened on release. A press that doesn't move stays a normal tap/click.
//
// The lens position is written straight to `trackRef` without re-rendering;
// React only hears about tab changes (onHover) and the release (onRelease).
export function useTabLens({
  enabled,
  barRef,
  trackRef,
  lensRef,
  count,
  onDragStart,
  onHover,
  onRelease,
}: {
  enabled: boolean;
  barRef: RefObject<HTMLElement | null>;
  // Positions the pill (translateX); one slot wide.
  trackRef: RefObject<HTMLElement | null>;
  // The pill's visible surface; gets data-lifted while dragging.
  lensRef: RefObject<HTMLElement | null>;
  count: number;
  onDragStart: () => void;
  onHover: (index: number) => void;
  // The tab the lens was released on, or null if the drag was cancelled.
  onRelease: (index: number | null) => void;
}) {
  const callbacks = useRef({ onDragStart, onHover, onRelease });
  useEffect(() => {
    callbacks.current = { onDragStart, onHover, onRelease };
  });

  useEffect(() => {
    const bar = barRef.current;
    const track = trackRef.current;
    const lens = lensRef.current;
    if (!enabled || !bar || !track || !lens) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let hover = -1;
    let slot = 0;
    let originX = 0;
    let suppressClick = false;
    let suppressTimer = 0;

    function lift(lifted: boolean) {
      lens!.dataset.lifted = String(lifted);
    }

    function onDown(e: PointerEvent) {
      if (pointerId !== null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
    }

    function onMove(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      if (!dragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) < DRAG_START_PX || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        hover = -1;
        slot = track!.offsetWidth;
        originX = bar!.getBoundingClientRect().left + BAR_INSET_PX;
        try {
          // Keep tracking if the finger drifts above or below the bar.
          bar!.setPointerCapture(e.pointerId);
        } catch {
          // Pointer already gone; the drag still works while over the bar.
        }
        callbacks.current.onDragStart();
        lift(true);
      }
      const x = Math.max(
        0,
        Math.min((count - 1) * slot, e.clientX - originX - slot / 2),
      );
      track!.style.opacity = "1";
      track!.style.transform = `translateX(${x}px)`;
      const index = Math.round(x / slot);
      if (index !== hover) {
        if (hover !== -1) haptic(10);
        hover = index;
        callbacks.current.onHover(index);
      }
    }

    function finish(e: PointerEvent, cancelled: boolean) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;
      lift(false);
      // The browser may still fire a click on the link under the finger.
      suppressClick = true;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(() => (suppressClick = false), 400);
      callbacks.current.onRelease(cancelled ? null : hover);
    }
    const onUp = (e: PointerEvent) => finish(e, false);
    const onCancel = (e: PointerEvent) => finish(e, true);

    function onClick(e: MouseEvent) {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    }

    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onCancel);
    bar.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(suppressTimer);
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onCancel);
      bar.removeEventListener("click", onClick, true);
      lift(false);
    };
  }, [enabled, count, barRef, trackRef, lensRef]);
}
