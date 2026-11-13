"use client";

import { animate, type AnimationPlaybackControls } from "motion/react";
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useSwipeFromRight } from "@/hooks/use-swipe-from-right";
import { haptic } from "@/lib/haptics";

// The mobile nav only shows below the md breakpoint.
const MD_BREAKPOINT_PX = 768;
// Drag at least this much of the drawer's width to open/close it...
const COMMIT_FRACTION = 0.25;
// ...or flick faster than this (px/s), whatever the distance.
const FLICK_PX_PER_S = 400;
// When closed the drawer sits this far past the screen edge so its shadow
// doesn't peek in.
const CLOSED_GAP_PX = 32;
const CLOSED_TRANSFORM = `translateX(calc(100% + ${CLOSED_GAP_PX}px))`;
const SPRING = { type: "spring", visualDuration: 0.3, bounce: 0 } as const;
// motion hands springs to the browser (Web Animations, run off the main
// thread) as an easing over 0–100. A bounce-free spring with this visual
// duration overshoots if it starts faster than ~100·ω ≈ 1745 of those units
// per second, so cap the release velocity we carry into it.
const MAX_EASING_VELOCITY = 1700;

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
const getViewportWidth = () => window.innerWidth;
const getServerViewportWidth = () => 0;
const subscribeNoop = () => () => {};

// Things that already handle sideways swipes themselves: the shadcn
// carousel, the embla tab strips (they all use touch-pan-y), and anything
// marked with data-swipe-nav-ignore.
const SWIPE_OWNER_SELECTOR =
  '[data-slot="carousel"], .touch-pan-y, [data-swipe-nav-ignore]';
const OPEN_DIALOG_SELECTOR =
  '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

// True when a leftward swipe starting here should go to the page instead of
// opening the menu.
function touchBelongsToPage(e: TouchEvent): boolean {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return false;
  if (target.closest(SWIPE_OWNER_SELECTOR)) return true;
  // Another drawer or dialog is already open.
  if (document.querySelector(OPEN_DIALOG_SELECTOR)) return true;
  // A table (or anything else) that can still scroll further right.
  for (
    let el: Element | null = target;
    el && el !== document.body;
    el = el.parentElement
  ) {
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    const { overflowX } = getComputedStyle(el);
    if (overflowX !== "auto" && overflowX !== "scroll") continue;
    if (el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
  }
  return false;
}

// Right-side nav drawer that opens from the menu button or by swiping left
// from the right half of the screen, and closes by tapping outside, tapping
// a link, Escape, or swiping it back to the right. Gesture logic follows the
// oxbros drawer (follows the finger 1:1, commits at 25%) plus flicks.
//
// For smoothness: the drawer is always mounted (nothing is created
// mid-gesture), drags write the transform straight to the element, and the
// settle animations are native transform/opacity springs via motion, which
// run off the main thread at the display's refresh rate. Scroll lock and
// focus wait until the open animation has finished.
export function SwipeNavSheet({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const animationsRef = useRef<AnimationPlaybackControls[]>([]);
  // Bumped whenever a drag or a new settle takes over, so a finished
  // animation knows whether its follow-up work is still wanted.
  const generationRef = useRef(0);
  const crossedRef = useRef(false);
  const restoreScrollRef = useRef<(() => void) | null>(null);
  const drawerId = useId();

  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const viewportWidth = useSyncExternalStore(
    subscribeToResize,
    getViewportWidth,
    getServerViewportWidth,
  );
  const swipeEnabled = viewportWidth > 0 && viewportWidth < MD_BREAKPOINT_PX;

  const lockScroll = useCallback(() => {
    if (restoreScrollRef.current) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    restoreScrollRef.current = () => {
      html.style.overflow = previous;
    };
  }, []);
  const unlockScroll = useCallback(() => {
    restoreScrollRef.current?.();
    restoreScrollRef.current = null;
  }, []);

  // stop() leaves the element where the animation had got to.
  const stopAnimations = useCallback(() => {
    if (animationsRef.current.length === 0) return;
    animationsRef.current.forEach((a) => a.stop());
    animationsRef.current = [];
    generationRef.current++;
  }, []);

  // During a drag: put the drawer exactly under the finger.
  const followFinger = useCallback(
    (offset: number, width: number) => {
      const drawer = drawerRef.current;
      const overlay = overlayRef.current;
      if (!drawer || !overlay) return;
      stopAnimations();
      drawer.style.transform = `translateX(${width - offset}px)`;
      overlay.style.opacity = String(offset / width);
    },
    [stopAnimations],
  );

  // Spring to fully open or closed from wherever the drawer is now.
  // `velocity` is the finger's speed toward open in px/s.
  const settle = useCallback(
    (toOpen: boolean, velocity = 0) => {
      const drawer = drawerRef.current;
      const overlay = overlayRef.current;
      if (!drawer || !overlay) return;
      stopAnimations();
      const generation = ++generationRef.current;

      const width = drawer.offsetWidth;
      const fromX = new DOMMatrix(getComputedStyle(drawer).transform).m41;
      const toX = toOpen ? 0 : width + CLOSED_GAP_PX;
      const fromOpacity = Number(getComputedStyle(overlay).opacity);
      const toOpacity = toOpen ? 1 : 0;

      // Opening moves the drawer toward x = 0, so finger speed toward open
      // is speed along -x. Convert to the 0–100 easing units motion uses for
      // native springs; ignore speed away from the target.
      const distance = toX - fromX;
      const easingVelocity =
        distance === 0
          ? 0
          : Math.min(
              MAX_EASING_VELOCITY,
              Math.max(0, (100 * -velocity) / distance),
            );

      const drawerAnimation = animate(
        drawer,
        { transform: [`translateX(${fromX}px)`, `translateX(${toX}px)`] },
        { ...SPRING, velocity: easingVelocity },
      );
      // motion rescales a numeric value's velocity into easing units itself,
      // so give opacity the matching value in its own units.
      const overlayAnimation = animate(
        overlay,
        { opacity: [fromOpacity, toOpacity] },
        {
          ...SPRING,
          velocity: (easingVelocity * (toOpacity - fromOpacity)) / 100,
        },
      );
      animationsRef.current = [drawerAnimation, overlayAnimation];
      // Set the resting values now. The running animations take precedence
      // over inline styles, so this shows only once they end, and the drawer
      // never depends on the finish event to land in the right place.
      drawer.style.transform = `translateX(${toX}px)`;
      overlay.style.opacity = String(toOpacity);

      openRef.current = toOpen;
      setOpen(toOpen);
      if (!toOpen && drawer.contains(document.activeElement)) {
        triggerRef.current?.focus({ preventScroll: true });
      }

      drawerAnimation.then(() => {
        if (generationRef.current !== generation) return;
        animationsRef.current = [];
        if (toOpen) {
          lockScroll();
          drawer.focus({ preventScroll: true });
        } else {
          unlockScroll();
          // Width-independent resting spot, in case the screen rotates.
          drawer.style.transform = CLOSED_TRANSFORM;
        }
      });
    },
    [stopAnimations, lockScroll, unlockScroll],
  );

  // Tap paths fire the haptic inside the originating user gesture. Swipe
  // paths fire theirs when the drag crosses the commit point.
  const openWithHaptic = useCallback(() => {
    haptic(10);
    settle(true);
  }, [settle]);
  const closeWithHaptic = useCallback(() => {
    haptic(10);
    settle(false);
  }, [settle]);

  const getWidth = () => drawerRef.current?.offsetWidth ?? 0;

  useSwipeFromRight({
    enabled: swipeEnabled && !open,
    mode: "open",
    getWidth,
    startWithinPx: viewportWidth / 2,
    canStart: (e) => !touchBelongsToPage(e),
    onDrag: (offset, width) => {
      followFinger(offset, width);
      if (!crossedRef.current && offset / width >= COMMIT_FRACTION) {
        crossedRef.current = true;
        haptic(10);
      }
    },
    onRelease: (offset, width, velocity) => {
      crossedRef.current = false;
      const shouldOpen =
        velocity > FLICK_PX_PER_S ||
        (velocity >= -FLICK_PX_PER_S && offset / width >= COMMIT_FRACTION);
      settle(shouldOpen, velocity);
    },
  });

  useSwipeFromRight({
    enabled: swipeEnabled && open,
    mode: "close",
    getWidth,
    onDrag: (offset, width) => {
      followFinger(offset, width);
      if (!crossedRef.current && offset / width <= 1 - COMMIT_FRACTION) {
        crossedRef.current = true;
        haptic(10);
      }
    },
    onRelease: (offset, width, velocity) => {
      crossedRef.current = false;
      const shouldClose =
        velocity < -FLICK_PX_PER_S ||
        (velocity <= FLICK_PX_PER_S && offset / width <= 1 - COMMIT_FRACTION);
      settle(!shouldClose, velocity);
    },
  });

  // A closed drawer is parked in px once an animation ends; re-park it if the
  // screen width changes (rotation) so it can't peek in.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || openRef.current || animationsRef.current.length > 0) return;
    drawer.style.transform = CLOSED_TRANSFORM;
  }, [viewportWidth, isClient]);

  // Escape closes while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWithHaptic();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeWithHaptic]);

  // Leaving the page mid-animation or while open: stop and unlock.
  useEffect(
    () => () => {
      animationsRef.current.forEach((a) => a.stop());
      unlockScroll();
    },
    [unlockScroll],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={openWithHaptic}
        className="relative focus:outline-hidden focus-visible:outline-hidden"
      >
        {trigger}
      </button>
      {isClient &&
        createPortal(
          <>
            <div
              ref={overlayRef}
              aria-hidden
              onClick={closeWithHaptic}
              className="fixed inset-0 z-50 touch-none bg-black/50 will-change-[opacity]"
              style={{ opacity: 0, pointerEvents: open ? "auto" : "none" }}
            />
            <div
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              aria-hidden={!open}
              tabIndex={-1}
              inert={!open}
              onClickCapture={(e) => {
                // Tapping a link closes the drawer while the page navigates.
                if ((e.target as Element).closest("a[href]")) closeWithHaptic();
              }}
              className="bg-card fixed inset-y-0 right-0 z-50 flex h-full w-4/5 flex-col gap-0 overflow-y-auto overscroll-contain shadow-lg outline-hidden will-change-transform sm:max-w-sm"
              style={{
                transform: CLOSED_TRANSFORM,
                paddingTop: "calc(env(safe-area-inset-top) + 16px)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
              }}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
