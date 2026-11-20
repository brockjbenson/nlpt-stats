"use client";

import ClockBadges from "@/features/clock/components/display/clock-badges";
import ClockFace from "@/features/clock/components/display/clock-face";
import FieldPanel from "@/features/clock/components/display/field-panel";
import type {
  ClockPlayers,
  MemberOption,
} from "@/features/clock/data/entrants";
import { useClock } from "@/features/clock/hooks/use-clock";
import { useEntrants } from "@/features/clock/hooks/use-entrants";
import { describeField } from "@/features/clock/lib/display";
import { entrantNames, listPlayers } from "@/features/clock/lib/players";
import type { TournamentClock } from "@/features/clock/types";
import { cn } from "@/lib/utils";

// The public, full-screen clock for a TV or phone: no header or tab bar,
// big text, kept live over Realtime. Once there are players, a panel
// beside (landscape) or under (portrait) the clock shows them and the money.
function ClockDisplay({
  initialClock,
  initialNowMs,
  initialPlayers,
  members,
}: {
  initialClock: TournamentClock;
  // The database time the page was rendered at.
  initialNowMs: number;
  initialPlayers: ClockPlayers;
  // Members to name the players by.
  members: MemberOption[];
}) {
  const { clock, view, connection, isDeleted } = useClock(
    initialClock,
    initialNowMs,
  );
  const { entrants, knockouts } = useEntrants(initialClock.id, initialPlayers);

  if (isDeleted) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4 text-center text-muted">
        This clock was deleted.
      </main>
    );
  }

  const hasPlayers = entrants.length > 0;
  const names = entrantNames(entrants, members);
  const { left } = listPlayers(entrants, knockouts, names);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-[3dvh] px-4 py-[4dvh]">
      <h1 className="text-[length:clamp(0.875rem,min(2.5vw,3dvh),1.75rem)] font-semibold text-muted">
        {clock.name}
      </h1>
      <ClockBadges
        status={view.status}
        connection={connection}
        className="absolute left-3 top-3"
      />
      <div
        className={cn(
          "flex w-full flex-col items-center gap-[3dvh]",
          hasPlayers && "landscape:flex-row landscape:gap-[3vw]",
        )}
      >
        <div className="flex min-w-0 flex-1 justify-center">
          <ClockFace
            view={view}
            size={hasPlayers ? "beside-panel" : "display"}
          />
        </div>
        {hasPlayers && (
          <FieldPanel
            field={describeField(clock, entrants)}
            namesLeft={left.map(({ name }) => name)}
            className="max-w-2xl landscape:w-[min(30vw,30rem)] landscape:shrink-0"
          />
        )}
      </div>
    </main>
  );
}

export default ClockDisplay;
