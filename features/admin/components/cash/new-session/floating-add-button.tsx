import { useScrollState } from "@/app/providers/scroll-context";
import { CashSession } from "@/utils/types";
import React from "react";
import SessionBalanceTracker from "./session-balance-tracker";

export default function FloatingAddButton({
  sessions,
  onClick,
  show,
}: {
  sessions: Omit<CashSession, "id">[];
  onClick: () => void;
  show: boolean;
}) {
  const { navTranslateY, navHeight } = useScrollState();
  const [shouldTransition, setShouldTransition] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = React.useState(0);

  // Track the bar's rendered height so the spacer below the list matches it
  React.useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBarHeight(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (show) {
      setShouldTransition(true);
      setTimeout(() => {
        setShouldTransition(false);
      }, 150);
    } else {
      setShouldTransition(true);
    }
  }, [show]);

  return (
    <>
      {/* In-flow spacer so the last list items can scroll above the fixed bar.
          The nav is always hidden at the bottom of the page, so its height is excluded. */}
      <div
        aria-hidden
        style={{ height: show ? Math.max(0, barHeight - navHeight) : 0 }}
      />
      <div
        ref={barRef}
        className="bg-background/80 border-t flex flex-col items-center justify-center border-t-muted backdrop-blur-md fixed bottom-0 left-0 right-0 w-full px-4 pt-4 z-9"
        style={{
          paddingBottom: `calc(${navHeight}px + 1rem)`,
          transform: show
            ? `translateY(max(0px, calc(${navTranslateY}px - env(safe-area-inset-bottom))))`
            : "translateY(100%)",
          willChange: "transform",
          transition: shouldTransition ? "transform 0.15s ease-out" : undefined,
        }}
      >
        <SessionBalanceTracker sessions={sessions} />
        <button
          onClick={onClick}
          className="flex w-full max-w-(--breakpoint-lg) text-sm md:text-base items-center justify-center px-3 h-10 text-white bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors"
        >
          Add Sessions ({sessions.length})
        </button>
      </div>
    </>
  );
}
