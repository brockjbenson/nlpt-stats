import type { BlindsText, ClockView } from "@/features/clock/lib/display";
import { formatClockTime } from "@/features/clock/lib/format";
import { cn } from "@/lib/utils";
import { Coffee } from "lucide-react";
import type React from "react";

export type ClockFaceSize = "display" | "beside-panel" | "compact";

// Text sizes per face. The display scales with the screen (the smaller of
// width and height), so it reads across a room on a TV in landscape and
// still fits a phone in portrait.
const SIZES: Record<
  ClockFaceSize,
  { root: string; title: string; time: string; blinds: string; detail: string }
> = {
  display: {
    root: "gap-[1.5dvh]",
    title: "text-[length:clamp(1.5rem,min(6vw,7dvh),4.5rem)] leading-tight",
    time: "text-[length:clamp(4.5rem,min(25vw,33dvh),24rem)]",
    blinds: "text-[length:clamp(2rem,min(10vw,12dvh),9rem)] leading-tight",
    detail: "text-[length:clamp(1rem,min(3.5vw,4dvh),2.5rem)]",
  },
  // The display with the players panel beside it in landscape: the face
  // gets about two thirds of the width, so the width-based sizes shrink to
  // match. In portrait the panel sits below and the full sizes apply.
  "beside-panel": {
    root: "gap-[1.5dvh]",
    title:
      "text-[length:clamp(1.5rem,min(6vw,7dvh),4.5rem)] landscape:text-[length:clamp(1.25rem,min(4vw,7dvh),4rem)] leading-tight",
    time: "text-[length:clamp(4.5rem,min(25vw,33dvh),24rem)] landscape:text-[length:clamp(3.5rem,min(15vw,33dvh),20rem)]",
    blinds:
      "text-[length:clamp(2rem,min(10vw,12dvh),9rem)] landscape:text-[length:clamp(1.75rem,min(6.5vw,12dvh),7.5rem)] leading-tight",
    detail:
      "text-[length:clamp(1rem,min(3.5vw,4dvh),2.5rem)] landscape:text-[length:clamp(0.9rem,min(2.3vw,4dvh),2rem)]",
  },
  compact: {
    root: "gap-2",
    title: "text-lg",
    // Leaves room for the ± buttons beside it on a phone.
    time: "text-6xl",
    blinds: "text-3xl",
    detail: "text-sm",
  },
};

function nextText(next: BlindsText): string {
  return next.ante ? `${next.blinds} (ante ${next.ante})` : next.blinds;
}

function Title({ view }: { view: ClockView }) {
  return (
    <p className="flex items-center justify-center gap-[0.4em] font-semibold uppercase tracking-wider text-muted">
      {view.isBreak && <Coffee className="size-[1em]" aria-hidden />}
      {view.title}
    </p>
  );
}

// The blinds and ante, or the break's note.
function Blinds({ view }: { view: ClockView }) {
  if (view.isBreak) {
    return view.note ? <p className="font-semibold">{view.note}</p> : null;
  }
  return (
    <div className="flex flex-col items-center">
      <p className="font-bold tabular-nums">{view.blinds}</p>
      {view.ante && (
        <p className="text-[0.45em] font-semibold text-muted tabular-nums">
          Ante {view.ante}
        </p>
      )}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full max-w-3xl overflow-hidden rounded-full bg-foreground/10">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

// What comes after this level: the next blinds and time to the next
// break, or "Final level" once there's nothing after it.
function UpNext({ view }: { view: ClockView }) {
  if (!view.next) {
    return <p className="font-semibold text-muted">Final level</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-[1.5em] gap-y-1 text-muted">
      <p>
        Next:{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {nextText(view.next)}
        </span>
      </p>
      {view.nextBreakMs !== null && (
        <p>
          Break in{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatClockTime(view.nextBreakMs)}
          </span>
        </p>
      )}
    </div>
  );
}

// A clock's level, countdown, blinds and what's next. Presentational: the
// display page and the admin control screen pass in a live ClockView. The
// control screen also puts buttons beside the countdown and below.
function ClockFace({
  view,
  size = "display",
  beforeTime,
  afterTime,
  children,
}: {
  view: ClockView;
  size?: ClockFaceSize;
  beforeTime?: React.ReactNode;
  afterTime?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const sizes = SIZES[size];
  const isRunning = view.status === "running";

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center text-center",
        sizes.root,
      )}
    >
      <div className={sizes.title}>
        <Title view={view} />
      </div>
      <div className="flex items-center justify-center gap-3">
        {beforeTime}
        <p
          role="timer"
          className={cn(
            "font-bold tabular-nums",
            sizes.time,
            // After the size: tailwind-merge drops a leading-* that comes
            // before a text-* size.
            "leading-none",
            !isRunning && "text-muted",
          )}
        >
          {view.timeText}
        </p>
        {afterTime}
      </div>
      <ProgressBar progress={view.progress} />
      <div className={sizes.blinds}>
        <Blinds view={view} />
      </div>
      <div className={sizes.detail}>
        <UpNext view={view} />
      </div>
      {children}
    </div>
  );
}

export default ClockFace;
