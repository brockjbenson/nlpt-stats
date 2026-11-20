"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type AccessoryPlacement,
  BottomTabAccessory,
} from "@/components/bottom-tabs/accessory";
import { useServerNow } from "@/features/clock/hooks/use-clock";
import { useLiveClock } from "@/features/clock/hooks/use-live-clock";
import { useOnVisible } from "@/features/clock/hooks/use-on-visible";
import { useServerOffset } from "@/features/clock/hooks/use-server-offset";
import {
  describeLiveClock,
  type LiveClockText,
} from "@/features/clock/lib/live";
import { clockDisplayPath } from "@/features/clock/lib/paths";
import type { TournamentClock } from "@/features/clock/types";

// "Level 5 · 12:34", "Break · 4:10" or "Paused".
function statusText({ detail, time }: LiveClockText): string {
  return time === null ? detail : `${detail} · ${time}`;
}

// What a screen reader announces: "Tournament live: Thanksgiving
// Showdown, Level 5, 12:34 left".
function bannerLabel({ name, detail, time }: LiveClockText): string {
  const timeLeft = time === null ? "" : `, ${time} left`;
  return `Tournament live: ${name}, ${detail}${timeLeft}`;
}

// A red dot: the "live" sign. Deliberately still: while an animation runs
// non-stop on the page, iOS 26 can't see the fixed header when it colors
// the status bar area, and shows its soft blur there instead (see
// components/page-transition.tsx).
function LiveDot() {
  return (
    <span
      className="inline-flex size-2.5 shrink-0 rounded-full bg-red-500"
      aria-hidden
    />
  );
}

function BannerContent({
  text,
  placement,
}: {
  text: LiveClockText;
  placement: AccessoryPlacement;
}) {
  if (placement === "inline") {
    return (
      <span className="flex size-full items-center justify-center gap-2 px-3 text-sm font-semibold tabular-nums">
        <LiveDot />
        {text.time ?? text.detail}
      </span>
    );
  }
  return (
    <span className="flex size-full items-center gap-3 px-4">
      <LiveDot />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-muted text-xs">Tournament live</span>
        <span className="truncate text-sm font-semibold">{text.name}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {statusText(text)}
      </span>
    </span>
  );
}

// The banner for one live clock, counting down on the database's time so
// it matches the display.
function LiveClockAccessory({ clock }: { clock: TournamentClock }) {
  const { offsetMs, resync } = useServerOffset();
  useEffect(() => {
    void resync();
  }, [resync]);
  useOnVisible(resync);
  // Only rendered in the browser once a clock is known to be live, so the
  // first tick starts from this device's time.
  const [mountedAtMs] = useState(() => Date.now());
  const nowMs = useServerNow(mountedAtMs, offsetMs);
  const text = describeLiveClock(clock, nowMs);

  return (
    <BottomTabAccessory className="border-red-500/60">
      {(placement) => (
        <Link
          href={clockDisplayPath(clock.id)}
          aria-label={bannerLabel(text)}
          className="flex size-full"
        >
          <BannerContent text={text} placement={placement} />
        </Link>
      )}
    </BottomTabAccessory>
  );
}

// "Tournament live": while a clock is running or paused, a capsule above
// the tab bar (at the bottom of the screen on desktop) links to its
// display. Nothing shows, and the tab bar is untouched, while none is.
function LiveClockBanner() {
  const clock = useLiveClock();
  if (!clock) return null;
  return <LiveClockAccessory key={clock.id} clock={clock} />;
}

export default LiveClockBanner;
