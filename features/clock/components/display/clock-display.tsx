"use client";

import ClockBadges from "@/features/clock/components/display/clock-badges";
import ClockFace from "@/features/clock/components/display/clock-face";
import { useClock } from "@/features/clock/hooks/use-clock";
import type { TournamentClock } from "@/features/clock/types";

// The public, full-screen clock for a TV or phone: no header or tab bar,
// big text, kept live over Realtime.
function ClockDisplay({
  initialClock,
  initialNowMs,
}: {
  initialClock: TournamentClock;
  // The database time the page was rendered at.
  initialNowMs: number;
}) {
  const { clock, view, connection, isDeleted } = useClock(
    initialClock,
    initialNowMs,
  );

  if (isDeleted) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4 text-center text-muted">
        This clock was deleted.
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-[3dvh] px-4 py-[4dvh]">
      <h1 className="text-[length:clamp(0.875rem,min(2.5vw,3dvh),1.75rem)] font-semibold text-muted">
        {clock.name}
      </h1>
      <ClockBadges status={view.status} connection={connection} />
      <ClockFace view={view} />
    </main>
  );
}

export default ClockDisplay;
