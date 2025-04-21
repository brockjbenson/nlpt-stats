"use client";

import { useEffect, useRef, useState } from "react";

const TRIGGER_THRESHOLD = 150;
const REFRESH_HOLD_GAP = 50;
const SHOW_INDICATOR_THRESHOLD = 50;

function usePullToRefresh(
  ref: React.RefObject<HTMLDivElement | null>,
  onTrigger: () => void
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [flipIndicator, setFlipIndicator] = useState(false);
  const [pullHeight, setPullHeight] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleTouchStart(startEvent: TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (el.scrollTop > 0) return;
      let target = startEvent.target as HTMLElement;

      while (target && target !== ref.current) {
        target = target.parentElement as HTMLElement;
      }

      if (!target || target !== ref.current) return;

      const initialY = startEvent.touches[0].clientY;
      const initialX = startEvent.touches[0].clientX;
      let isHorizontalScroll = false;

      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd);

      function handleTouchMove(moveEvent: TouchEvent) {
        const el = ref.current;
        if (!el) return;

        const currentY = moveEvent.touches[0].clientY;
        const currentX = moveEvent.touches[0].clientX;

        const dy = currentY - initialY;
        const dx = currentX - initialX;

        // If horizontal movement is more dominant, stop tracking
        if (!isHorizontalScroll && Math.abs(dx) > Math.abs(dy)) {
          isHorizontalScroll = true;
        }

        if (isHorizontalScroll || dy < 0) return;

        moveEvent.preventDefault(); // We'll remove this if it's horizontal

        setPullHeight(appr(dy));

        if (dy > TRIGGER_THRESHOLD) {
          setFlipIndicator(true);
        } else if (dy > SHOW_INDICATOR_THRESHOLD) {
          setShowIndicator(true);
          setFlipIndicator(false);
        } else {
          setShowIndicator(false);
          setFlipIndicator(false);
        }

        el.style.transform = `translateY(${appr(dy)}px)`;
      }

      function handleTouchEnd(endEvent: TouchEvent) {
        const el = ref.current;
        if (!el) return;

        if (isHorizontalScroll) {
          // Don't trigger refresh or any animation
          el.style.transform = "translateY(0)";
          el.style.transition = "transform 0.2s";
          setTimeout(() => {
            el.style.transition = "transform 0s";
          }, 200);
          el.removeEventListener("touchmove", handleTouchMove);
          el.removeEventListener("touchend", handleTouchEnd);
          return;
        }

        const y = endEvent.changedTouches[0].clientY;
        const dy = y - initialY;

        el.style.transition = "transform 0.2s";
        el.style.transform = `translateY(${dy > TRIGGER_THRESHOLD ? REFRESH_HOLD_GAP : 0}px)`;
        setAnimate(true);
        setPullHeight(dy > TRIGGER_THRESHOLD ? REFRESH_HOLD_GAP : 0);

        if (dy > TRIGGER_THRESHOLD) {
          setIsRefreshing(true);
          const MIN_DISPLAY_TIME = 500;
          const startTime = Date.now();

          Promise.resolve(onTrigger()).then(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

            setTimeout(() => {
              setIsRefreshing(false);
              setPullHeight(0);
              setShowIndicator(false);
              el.style.transition = "transform 0.2s";
              el.style.transform = "translateY(0)";

              setTimeout(() => {
                el.style.transition = "transform 0s";
                setFlipIndicator(false);
                setAnimate(false);
              }, 200);
            }, remainingTime);
          });
        } else {
          setShowIndicator(false);
          setFlipIndicator(false);
          setPullHeight(0);
          setAnimate(false);
        }

        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    }

    el.addEventListener("touchstart", handleTouchStart);
    return () => el.removeEventListener("touchstart", handleTouchStart);
  }, [ref, onTrigger, isRefreshing]);

  return {
    isRefreshing,
    showIndicator,
    flipIndicator,
    pullHeight,
    animate,
    SHOW_INDICATOR_THRESHOLD,
  };
}

function appr(x: number) {
  const MAX = 96,
    k = 0.5;
  return MAX * (1 - Math.exp((-k * x) / MAX));
}

export default usePullToRefresh;
