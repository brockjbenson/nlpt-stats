"use client";

import {
  animate,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { LineChart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FaTrophy, FaUsers } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { TbWorldStar } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { setBottomTabsState, useBottomTabsState } from "./store";
import BottomTab from "./tab";
import { useMinimizeOnScroll } from "./use-minimize-on-scroll";
import { BAR_INSET_PX, useTabLens } from "./use-tab-lens";

type TabDef = {
  // Also the path fragment that marks this tab as active (as before).
  id: string;
  label: string;
  href: (year: number) => string;
  icon: React.ReactNode;
};

const TABS: TabDef[] = [
  {
    id: "stats",
    label: "Stats",
    href: (year) => `/stats/cumulative/${year}`,
    icon: <LineChart className="size-6" />,
  },
  {
    id: "tournament",
    label: "Tourney's",
    href: (year) => `/tournaments/${year}`,
    icon: <FaTrophy className="size-5" />,
  },
  {
    id: "members",
    label: "Members",
    href: () => "/members",
    icon: <FaUsers className="size-6" />,
  },
  {
    id: "poy",
    label: "POY",
    href: (year) => `/poy/${year}`,
    icon: <FaRankingStar className="size-6" />,
  },
  {
    id: "nlpi",
    label: "NLPI",
    href: () => "/nlpi",
    icon: <TbWorldStar className="size-[22px]" />,
  },
];

function tabIndexForPath(pathname: string): number | null {
  const index = TABS.findIndex((tab) => pathname.includes(tab.id));
  return index === -1 ? null : index;
}

// Solid surface shared by the bar, the minimized capsule and the accessory:
// the page header's color with a slightly darker border, no transparency.
// The shadow lifts it off page content of the same color.
const SURFACE =
  "border border-neutral-800 bg-background shadow-lg shadow-black/40";

// Native (Web Animations) springs: they run off the main thread.
const PILL_SPRING = {
  type: "spring",
  visualDuration: 0.35,
  bounce: 0.12,
} as const;
// Minimized capsule size; the bar's background shrinks down to this.
const CAPSULE_PX = 62;
// Bottom accessory (see accessory.tsx): its height, and the gap between it
// and the tab bar (or the small capsule when it's inline).
const ACCESSORY_PX = 52;
const GAP_PX = 8;
// Where the accessory sits when inline: right of the small capsule,
// vertically centered in the tab bar's row. (Its resting spot is one
// accessory + gap above that row.)
const ACCESSORY_INLINE = `translate(${CAPSULE_PX + GAP_PX}px, ${
  ACCESSORY_PX + GAP_PX + (CAPSULE_PX - ACCESSORY_PX) / 2
}px)`;
const ACCESSORY_EXPANDED = "translate(0px, 0px)";
// Shrink/expand timing: an iOS-style ease-out (fast start, long settle).
const SHRINK_MS = 420;
const SHRINK_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
// The tabs are sized to the full bar so they get clipped, not squeezed, as
// the background shrinks (the container is max 420px inside 16px gutters).
// (Less the background's 1px border on each side.)
const FULL_BAR_WIDTH = "calc(min(420px, 100vw - 2rem) - 2px)";

// Animate one style property from its current value with the Web Animations
// API (browser-driven, no JS per frame). The resting value is set inline
// straight away; the running animation overrides it until it ends, so
// nothing depends on the finish event.
function animateStyle(
  el: HTMLElement,
  property: "width" | "opacity" | "transform",
  from: string,
  to: string,
  animated: boolean,
  options: KeyframeAnimationOptions = {},
): Animation | null {
  const animation = animated
    ? el.animate([{ [property]: from }, { [property]: to }], {
        duration: SHRINK_MS,
        easing: SHRINK_EASE,
        ...options,
        fill: "backwards",
      })
    : null;
  el.style[property] = to;
  return animation;
}

// iOS 26–style floating tab bar: a solid capsule with a sliding selection
// pill, press-and-slide to switch tabs, and minimize-on-scroll.
function BottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const year = new Date().getFullYear();

  // Tapped/selected tab, shown before the new page has loaded.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setPendingIndex(null);
  }
  const activeIndex = pendingIndex ?? tabIndexForPath(pathname);
  // The tab under the lens while dragging.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const highlightedIndex = hoverIndex ?? activeIndex;
  const activeTab = activeIndex === null ? null : TABS[activeIndex];

  // Only pages with a tab of their own collapse to that tab's capsule.
  const [minimized, setMinimized, ignoreScrollFor] = useMinimizeOnScroll(
    activeIndex !== null,
  );
  // A page is showing a bottom accessory (see accessory.tsx).
  const hasAccessory = useBottomTabsState((s) => s.accessories > 0);
  const accessoryClassName = useBottomTabsState((s) => s.accessoryClassName);

  const slotRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLButtonElement>(null);
  const pillAnimation = useRef<AnimationPlaybackControls | null>(null);
  const pillIndex = useRef<number | null>(null);
  const pillPlaced = useRef(false);
  const dragging = useRef(false);
  const minimizeAnimations = useRef<Animation[]>([]);
  const minimizePlaced = useRef(false);
  // Set when the capsule is tapped near the bottom of the page: once the
  // accessory's space is back, scroll so it doesn't cover the last content.
  const revealBottom = useRef(false);

  // Tap on the minimized capsule: expand the bar (no navigation).
  const expandFromCapsule = () => {
    const doc = document.documentElement;
    const fromBottom = doc.scrollHeight - window.innerHeight - window.scrollY;
    revealBottom.current = hasAccessory && fromBottom < ACCESSORY_PX + GAP_PX;
    setMinimized(false);
  };

  // Slide the pill to a tab (or hide it when no tab is active).
  const movePill = useCallback(
    (index: number | null, animated: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      pillAnimation.current?.stop();
      pillAnimation.current = null;
      pillIndex.current = index;
      if (index === null) {
        track.style.opacity = "0";
        return;
      }
      const to = `translateX(${index * track.offsetWidth}px)`;
      const wasHidden = track.style.opacity === "0";
      track.style.opacity = "1";
      if (animated && !wasHidden && !reduceMotion) {
        const fromX = new DOMMatrix(getComputedStyle(track).transform).m41;
        pillAnimation.current = animate(
          track,
          { transform: [`translateX(${fromX}px)`, to] },
          PILL_SPRING,
        );
      }
      track.style.transform = to;
    },
    [reduceMotion],
  );

  useLayoutEffect(() => {
    if (dragging.current) return;
    if (pillPlaced.current && pillIndex.current === activeIndex) return;
    movePill(activeIndex, pillPlaced.current);
    pillPlaced.current = true;
  }, [activeIndex, movePill]);

  // Keep the pill on its tab if the bar changes width (rotation).
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      if (!dragging.current) movePill(pillIndex.current, false);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, [movePill]);

  // On phones the page only makes room for the accessory while it sits above
  // the bar (main-wrapper adds --accessory-space to its bottom padding). When
  // minimized it's inline in the bar's row and needs no extra room. (Desktop
  // reserves it in the nav itself; see md:pt-15 below.)
  useLayoutEffect(() => {
    const doc = document.documentElement;
    const mobile = window.matchMedia("(max-width: 767.98px)").matches;
    const reserve = hasAccessory && !minimized && mobile;
    doc.style.setProperty(
      "--accessory-space",
      reserve ? `${ACCESSORY_PX + GAP_PX}px` : "0px",
    );
    if (reserve && revealBottom.current) {
      // The page just grew by the accessory's space; scroll it into view
      // alongside the accessory moving up.
      ignoreScrollFor(800);
      window.scrollTo({
        top: doc.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    revealBottom.current = false;
  }, [hasAccessory, minimized, reduceMotion, ignoreScrollFor]);

  useEffect(
    () => () =>
      document.documentElement.style.setProperty("--accessory-space", "0px"),
    [],
  );

  // Hand accessories the element to render into, and tell them whether the
  // bar is minimized (inline placement) or not.
  useLayoutEffect(() => {
    setBottomTabsState({ slot: slotRef.current });
    return () => setBottomTabsState({ slot: null, minimized: false });
  }, []);
  useLayoutEffect(() => {
    setBottomTabsState({ minimized });
  }, [minimized]);

  // Shrink the background into the small capsule (clipping the tabs as it
  // goes), or grow it back out, and move the accessory between its
  // above-the-bar and inline spots. Starts from wherever things are now, so
  // reversing mid-animation is smooth.
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const bar = barRef.current;
    const compact = compactRef.current;
    const slot = slotRef.current;
    if (!surface || !bar || !compact || !slot) return;
    const animated = minimizePlaced.current && !reduceMotion;
    const fromWidth = `${surface.getBoundingClientRect().width}px`;
    const fromBar = getComputedStyle(bar).opacity;
    const fromCompact = getComputedStyle(compact).opacity;
    // The slot is display:none with no accessory; then just place it.
    const slotWidth = slot.getBoundingClientRect().width;
    const slotAnimated = animated && slotWidth > 0;
    const fromSlotWidth = `${slotWidth}px`;
    const fromSlotTransform = getComputedStyle(slot).transform;
    minimizeAnimations.current.forEach((a) => a.cancel());
    const slotAnimations = [
      animateStyle(
        slot,
        "transform",
        fromSlotTransform === "none" ? ACCESSORY_EXPANDED : fromSlotTransform,
        minimized ? ACCESSORY_INLINE : ACCESSORY_EXPANDED,
        slotAnimated,
      ),
      animateStyle(
        slot,
        "width",
        fromSlotWidth,
        minimized ? `calc(100% - ${CAPSULE_PX + GAP_PX}px)` : "100%",
        slotAnimated,
      ),
    ];
    const animations = minimized
      ? [
          animateStyle(
            surface,
            "width",
            fromWidth,
            `${CAPSULE_PX}px`,
            animated,
          ),
          animateStyle(bar, "opacity", fromBar, "0", animated, {
            duration: 200,
          }),
          animateStyle(compact, "opacity", fromCompact, "1", animated, {
            duration: 200,
            delay: 200,
          }),
        ]
      : [
          animateStyle(surface, "width", fromWidth, "100%", animated),
          animateStyle(compact, "opacity", fromCompact, "0", animated, {
            duration: 120,
          }),
          animateStyle(bar, "opacity", fromBar, "1", animated, {
            duration: 260,
            delay: 100,
          }),
        ];
    minimizeAnimations.current = [...animations, ...slotAnimations].filter(
      (a): a is Animation => a !== null,
    );
    minimizePlaced.current = true;
  }, [minimized, reduceMotion]);

  useEffect(
    () => () => {
      pillAnimation.current?.stop();
      minimizeAnimations.current.forEach((a) => a.cancel());
    },
    [],
  );

  useTabLens({
    enabled: !minimized,
    barRef,
    trackRef,
    lensRef,
    count: TABS.length,
    onDragStart: () => {
      dragging.current = true;
      pillAnimation.current?.stop();
      pillAnimation.current = null;
    },
    onHover: (index) => setHoverIndex(index),
    onRelease: (index) => {
      dragging.current = false;
      setHoverIndex(null);
      movePill(index ?? activeIndex, true);
      if (index !== null && index !== activeIndex) {
        setPendingIndex(index);
        router.push(TABS[index].href(year));
      }
    },
  });

  return (
    <nav
      id="mobile-nav"
      aria-label="Main"
      // The swipe-to-open menu leaves sideways drags on the bar alone.
      data-swipe-nav-ignore
      // Desktop has no tab bar, but still shows a page's accessory.
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4",
        !hasAccessory && "md:hidden",
      )}
    >
      <div
        className={cn(
          "relative mx-auto max-w-[420px]",
          // On phones the accessory hangs above the bar without adding to
          // --nav-height (the page's bottom padding): it drops into the bar's
          // row once you scroll. Desktop has no bar row, so reserve its space
          // (accessory + gap = 60px) there.
          hasAccessory && "md:pt-15",
        )}
      >
        {/* Bottom accessory slot: pages portal into it via
            <BottomTabAccessory>. Above the bar when expanded; beside the
            small capsule when minimized. */}
        <div
          ref={slotRef}
          className={cn(
            "absolute -top-15 left-0 overflow-hidden rounded-full md:top-0",
            hasAccessory
              ? cn(SURFACE, "pointer-events-auto", accessoryClassName)
              : "hidden",
          )}
          style={{
            height: ACCESSORY_PX,
            width: "100%",
            transform: ACCESSORY_EXPANDED,
          }}
        />
        <div className="relative h-[62px] md:hidden">
          {/* Tinted background. Shrinks to the capsule when minimized; the
            tabs inside keep their full width so they're clipped, not squeezed. */}
          <div
            ref={surfaceRef}
            className={cn(
              SURFACE,
              "absolute inset-y-0 left-0 overflow-hidden rounded-full",
            )}
            style={{ width: "100%" }}
          >
            <div
              ref={barRef}
              inert={minimized}
              className={cn(
                "absolute inset-y-0 left-0 touch-none select-none",
                minimized ? "pointer-events-none" : "pointer-events-auto",
              )}
              style={{ width: FULL_BAR_WIDTH, opacity: 1 }}
            >
              <div
                ref={trackRef}
                aria-hidden
                className="absolute top-1 bottom-1 left-1 transition-opacity duration-200"
                style={{
                  width: `calc((100% - ${BAR_INSET_PX * 2}px) / ${TABS.length})`,
                  opacity: 0,
                }}
              >
                <div
                  ref={lensRef}
                  data-lifted="false"
                  className="size-full rounded-full bg-white/10 transition-[scale,background-color] duration-200 ease-out data-[lifted=true]:scale-115 data-[lifted=true]:bg-white/15"
                />
              </div>
              <ul className="relative grid h-full grid-cols-5 px-1">
                {TABS.map((tab, index) => (
                  <li key={tab.id} className="h-full">
                    <BottomTab
                      href={tab.href(year)}
                      label={tab.label}
                      icon={tab.icon}
                      highlighted={highlightedIndex === index}
                      current={activeIndex === index}
                      onClick={() => setPendingIndex(index)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Minimized: the current tab's icon on the shrunken background. */}
          <button
            ref={compactRef}
            type="button"
            inert={!minimized}
            aria-label={`Show tabs${activeTab ? ` (${activeTab.label})` : ""}`}
            onClick={expandFromCapsule}
            className={cn(
              "absolute bottom-0 left-0 flex items-center justify-center rounded-full text-primary",
              minimized ? "pointer-events-auto" : "pointer-events-none",
            )}
            style={{ width: CAPSULE_PX, height: CAPSULE_PX, opacity: 0 }}
          >
            {activeTab?.icon}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default BottomTabs;
