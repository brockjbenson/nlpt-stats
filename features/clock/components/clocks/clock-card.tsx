import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteClockButton from "@/features/clock/components/clocks/delete-clock-button";
import type { ClockSummary } from "@/features/clock/data/clocks";
import { clockStatusLabel } from "@/features/clock/lib/clocks";
import { formatClockDate } from "@/features/clock/lib/format";
import {
  clockControlPath,
  clockDisplayPath,
  clockFinishPath,
  tournamentPath,
} from "@/features/clock/lib/paths";
import type { ClockStatus } from "@/features/clock/types";
import { CheckCircle2, MonitorPlay, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const STATUS_BADGES: Record<ClockStatus, BadgeProps["variant"]> = {
  setup: "outline",
  running: "default",
  paused: "secondary",
  finished: "outline",
};

// A finished clock's results: saved (with a link to the tournament) or
// waiting to be reviewed and saved.
function ResultsStatus({ clock }: { clock: ClockSummary }) {
  if (clock.status !== "finished") return null;
  const { tournament } = clock;
  if (tournament) {
    // The tournament page reads only the id; the year is for the address.
    const year = Number(tournament.date.slice(0, 4));
    return (
      <Link
        href={tournamentPath(year, tournament.id)}
        className="inline-flex items-center gap-1.5 text-foreground hover:underline"
      >
        <CheckCircle2 size={16} className="text-primary" /> Results saved
      </Link>
    );
  }
  return (
    <Link
      href={clockFinishPath(clock.id)}
      className="font-semibold text-primary hover:underline"
    >
      Results not saved · Review
    </Link>
  );
}

function ClockCard({ clock }: { clock: ClockSummary }) {
  const controlHref = clockControlPath(clock.id);
  const displayHref = clockDisplayPath(clock.id);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-lg leading-tight">
          <Link href={controlHref} className="hover:underline">
            {clock.name}
          </Link>
        </CardTitle>
        <DeleteClockButton id={clock.id} name={clock.name} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGES[clock.status]}>
            {clockStatusLabel(clock.status)}
          </Badge>
          <span>Created {formatClockDate(Date.parse(clock.created_at))}</span>
        </div>
        <ResultsStatus clock={clock} />
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href={controlHref}>
              <SlidersHorizontal /> Control
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={displayHref} target="_blank" rel="noopener">
              <MonitorPlay /> Display
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ClockCard;
