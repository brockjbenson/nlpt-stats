"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { controlClockAction } from "@/features/clock/actions/clocks";
import ControlButtons from "@/features/clock/components/control/control-buttons";
import { useCatchUp } from "@/features/clock/components/control/use-catch-up";
import ClockBadges from "@/features/clock/components/display/clock-badges";
import ClockFace from "@/features/clock/components/display/clock-face";
import { useClock } from "@/features/clock/hooks/use-clock";
import type { ClockControl } from "@/features/clock/lib/controls";
import type { TournamentClock } from "@/features/clock/types";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Link2, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

const CLOCKS_HREF = "/admin/clock";

function displayPath(id: string): string {
  return `/clock/${id}`;
}

// Opens the display in a new tab, or copies its link to send to the TV or
// another phone.
function DisplayLinks({ id }: { id: string }) {
  const { toast } = useToast();

  const copy = async (): Promise<void> => {
    const url = `${window.location.origin}${displayPath(id)}`;
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
        <Link href={displayPath(id)} target="_blank" rel="noopener">
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
// controls. Each press is one server action; the saved row shows at once
// and every other screen gets it over Realtime.
function ClockControls({
  initialClock,
  initialNowMs,
}: {
  initialClock: TournamentClock;
  // The database time the page was rendered at.
  initialNowMs: number;
}) {
  const { toast } = useToast();
  const { clock, view, connection, isDeleted, applyRow } = useClock(
    initialClock,
    initialNowMs,
  );
  const [isPending, startTransition] = useTransition();
  useCatchUp(clock, view.position.levelIndex, applyRow);

  const control = (action: ClockControl): void => {
    startTransition(async () => {
      const result = await controlClockAction(clock.id, action);
      if (result.clock) applyRow(result.clock);
      if (!result.success) {
        toast({
          title: "Couldn't update the clock",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      <Link
        href={CLOCKS_HREF}
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
              <ClockFace view={view} size="compact" />
            </CardContent>
          </Card>
          <ControlButtons
            view={view}
            isPending={isPending}
            onControl={control}
          />
          <DisplayLinks id={clock.id} />
        </>
      )}
    </div>
  );
}

export default ClockControls;
