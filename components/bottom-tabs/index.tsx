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

// Tinted blur shared by the bar and the minimized capsule. With "Reduce
// Transparency" on it becomes a solid card color.
const SURFACE =
  "border border-white/10 bg-neutral-900/70 shadow-lg shadow-black/40 backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-card [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none";

// Native (Web Animations) springs: they run off the main thread.
const PILL_SPRING = {
  type: "spring",
  visualDuration: 0.35,
  bounce: 0.12,
} as const;
// Minimized capsule size; the bar's background shrinks down to this.
const CAPSULE_PX = 62;
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
  property: "width" | "opacity",
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

// iOS 26–style floating tab bar: a tinted-blur capsule with a sliding selection
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
  const [minimized, setMinimized] = useMinimizeOnScroll(activeIndex !== null);

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

  // Shrink the background into the small capsule (clipping the tabs as it
  // goes), or grow it back out. Starts from wherever things are now, so
  // reversing mid-animation is smooth.
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const bar = barRef.current;
    const compact = compactRef.current;
    if (!surface || !bar || !compact) return;
    const animated = minimizePlaced.current && !reduceMotion;
    const fromWidth = `${surface.getBoundingClientRect().width}px`;
    const fromBar = getComputedStyle(bar).opacity;
    const fromCompact = getComputedStyle(compact).opacity;
    minimizeAnimations.current.forEach((a) => a.cancel());
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
    minimizeAnimations.current = animations.filter(
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 md:hidden"
    >
      <div className="relative mx-auto h-[62px] max-w-[420px]">
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
          onClick={() => setMinimized(false)}
          className={cn(
            "absolute bottom-0 left-0 flex items-center justify-center rounded-full text-primary",
            minimized ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{ width: CAPSULE_PX, height: CAPSULE_PX, opacity: 0 }}
        >
          {activeTab?.icon}
        </button>
      </div>
    </nav>
  );
}

export default BottomTabs;
