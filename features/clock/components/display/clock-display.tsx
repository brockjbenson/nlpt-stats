"use client";

import ClockFace from "@/features/clock/components/display/clock-face";
import DisplayHeader from "@/features/clock/components/display/display-header";
import FieldPanel from "@/features/clock/components/display/field-panel";
import type {
  ClockPlayers,
  MemberOption,
} from "@/features/clock/data/entrants";
import { useClock } from "@/features/clock/hooks/use-clock";
import { useEntrants } from "@/features/clock/hooks/use-entrants";
import { useSound } from "@/features/clock/hooks/use-sound";
import { useSoundCues } from "@/features/clock/hooks/use-sound-cues";
import { useIdle } from "@/features/clock/hooks/use-idle";
import { useTvMode } from "@/features/clock/hooks/use-tv-mode";
import { describeField } from "@/features/clock/lib/display";
import { entrantNames, listPlayers } from "@/features/clock/lib/players";
import type { TournamentClock } from "@/features/clock/types";
import { cn } from "@/lib/utils";

// The public, full-screen clock for a TV or phone: its own slim header
// (status and controls) instead of the app's header and tab bar, big
// text, kept live over Realtime. Once there are players, a panel
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
  // Members to name the players by and show the photos of.
  members: MemberOption[];
}) {
  const { clock, view, nowMs, connection, isDeleted } = useClock(
    initialClock,
    initialNowMs,
  );
  const { entrants, knockouts } = useEntrants(initialClock.id, initialPlayers);
  const sound = useSound();
  useSoundCues(view, nowMs, sound.play);
  const tv = useTvMode();
  // In TV mode, the corner controls and the cursor hide when idle.
  const isIdle = useIdle(tv.isTvMode);

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
  const portraits = new Map(
    members.map(({ id, portrait_url }) => [id, portrait_url]),
  );

  return (
    <div
      className={cn("flex min-h-dvh flex-col", isIdle && "cursor-none")}
      // While sound waits for a tap, any tap on the page allows it.
      onClick={sound.needsTap ? sound.unlockFromTap : undefined}
    >
      <DisplayHeader
        status={view.status}
        connection={connection}
        sound={sound}
        tv={tv}
        isIdle={isIdle}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-[3dvh] px-4 pb-[4dvh] pt-[2dvh]">
        <h1 className="text-[length:clamp(0.875rem,min(2.5vw,3dvh),1.75rem)] font-semibold text-muted">
          {clock.name}
        </h1>
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
              playersLeft={left.map(({ entrant, name }) => ({
                id: entrant.id,
                name,
                portraitUrl: entrant.member_id
                  ? (portraits.get(entrant.member_id) ?? null)
                  : null,
              }))}
              className="max-w-2xl landscape:w-[min(36vw,36rem)] landscape:shrink-0"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default ClockDisplay;
