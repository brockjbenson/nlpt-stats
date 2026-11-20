"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AdjustTimeButton,
  PlaybackControls,
} from "@/features/clock/components/control/control-buttons";
import { useCatchUp } from "@/features/clock/components/control/use-catch-up";
import { useClockControl } from "@/features/clock/components/control/use-clock-control";
import ClockBadges from "@/features/clock/components/display/clock-badges";
import ClockFace from "@/features/clock/components/display/clock-face";
import { useClock } from "@/features/clock/hooks/use-clock";
import { CLOCKS_PATH, clockDisplayPath } from "@/features/clock/lib/paths";
import type { TournamentClock } from "@/features/clock/types";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Link2, MonitorPlay } from "lucide-react";
import Link from "next/link";

// Opens the display in a new tab, or copies its link to send to the TV or
// another phone.
function DisplayLinks({ id }: { id: string }) {
  const { toast } = useToast();

  const copy = async (): Promise<void> => {
    const url = `${window.location.origin}${clockDisplayPath(id)}`;
    // The clipboard needs a secure context (https or localhost); on a LAN
    // address, show the link instead so it can be copied by hand.
    if (!navigator.clipboard) {
      toast({ title: "Display link", description: url });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Display link copied", description: url });
    } catch {
      toast({ title: "Display link", description: url });
    }
  };

  return (
    <div className="flex gap-2">
      <Button className="flex-1" variant="outline" asChild>
        <Link href={clockDisplayPath(id)} target="_blank" rel="noopener">
          <MonitorPlay /> Open display
        </Link>
      </Button>
      <Button className="flex-1" variant="outline" onClick={() => void copy()}>
        <Link2 /> Copy display link
      </Button>
    </div>
  );
}

// The admin's remote for one clock: a live view of the clock and its
// controls. A press shows its change at once (planned with the same rules
// the server uses), then one server action saves it; the saved row
// replaces the plan, and every other screen gets it over Realtime.
function ClockControls({
  initialClock,
  initialNowMs,
}: {
  initialClock: TournamentClock;
  // The database time the page was rendered at.
  initialNowMs: number;
}) {
  const live = useClock(initialClock, initialNowMs);
  const { clock, view, connection, isDeleted, applyRow } = live;
  useCatchUp(clock, view.position.levelIndex, applyRow);
  const control = useClockControl(live);

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      <Link
        href={CLOCKS_PATH}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
      >
        <ChevronLeft size={16} /> Clocks
      </Link>
      {isDeleted ? (
        <p className="py-8 text-center text-muted">This clock was deleted.</p>
      ) : (
        <>
          <Card className="relative py-6">
            <ClockBadges
              status={view.status}
              connection={connection}
              size="compact"
            />
            <CardContent>
              <ClockFace
                view={view}
                size="compact"
                beforeTime={
                  <AdjustTimeButton
                    minutes={-1}
                    view={view}
                    onControl={control}
                  />
                }
                afterTime={
                  <AdjustTimeButton
                    minutes={1}
                    view={view}
                    onControl={control}
                  />
                }
              >
                <PlaybackControls view={view} onControl={control} />
              </ClockFace>
            </CardContent>
          </Card>
          <DisplayLinks id={clock.id} />
        </>
      )}
    </div>
  );
}

export default ClockControls;
