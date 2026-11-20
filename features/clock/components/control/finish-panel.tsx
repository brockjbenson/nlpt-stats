"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  type ClockFinishResult,
  finishClockAction,
  reopenClockAction,
} from "@/features/clock/actions/clocks";
import type { MemberOption } from "@/features/clock/data/entrants";
import type { LivePlayers } from "@/features/clock/hooks/use-entrants";
import {
  canReopen,
  finishRefusalMessage,
  planFinishClock,
} from "@/features/clock/lib/finish";
import { clockFinishPath } from "@/features/clock/lib/paths";
import { entrantNames } from "@/features/clock/lib/players";
import type { TournamentClock } from "@/features/clock/types";
import { useToast } from "@/hooks/use-toast";
import { Flag, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  clock: TournamentClock;
  players: LivePlayers;
  members: MemberOption[];
  nowMs: number;
  // Shows the saved clock at once, before its Realtime event.
  applyRow: (clock: TournamentClock) => void;
};

// Runs the finish or reopen action and shows what it saved.
function useFinishAction({
  players,
  applyRow,
}: Pick<Props, "players" | "applyRow">) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const run = (
    failureTitle: string,
    action: () => Promise<ClockFinishResult>,
    onSuccess?: () => void,
  ): void => {
    startTransition(async () => {
      const result = await action();
      if (result.clock) applyRow(result.clock);
      if (result.entrants) players.applyResult({ entrants: result.entrants });
      if (result.success) {
        onSuccess?.();
        return;
      }
      toast({
        title: failureTitle,
        description: result.message,
        variant: "destructive",
      });
    });
  };

  return { run, isPending };
}

// End tournament, while running or paused: enabled once one player is
// left, and asks first.
function EndTournament({
  clock,
  winnerName,
  refusal,
  run,
  isPending,
}: {
  clock: TournamentClock;
  winnerName: string | null;
  refusal: string | null;
  run: ReturnType<typeof useFinishAction>["run"];
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {refusal ?? `${winnerName} is the last player left.`}
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={refusal !== null || isPending}
          >
            <Flag size={14} /> End tournament
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End the tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              {winnerName} wins. The clock stops, and you can review and save
              the results next. You can reopen it until they&rsquo;re saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                // Keep the dialog open until it's saved.
                event.preventDefault();
                run(
                  "Couldn't end the tournament",
                  () => finishClockAction(clock.id),
                  () => setOpen(false),
                );
              }}
            >
              {isPending ? <Spinner /> : "End tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// A finished clock: who won, and the way to its results (or back, until
// they're saved).
function Finished({
  clock,
  winnerName,
  run,
  isPending,
}: {
  clock: TournamentClock;
  winnerName: string | null;
  run: ReturnType<typeof useFinishAction>["run"];
  isPending: boolean;
}) {
  const isSaved = clock.tournament_id !== null;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-semibold">
        <Trophy size={18} className="text-primary" />
        Finished{winnerName ? ` · ${winnerName} wins` : ""}
      </p>
      {isSaved && <p className="text-sm text-muted">Results saved.</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={clockFinishPath(clock.id)}>
            {isSaved ? "Edit results" : "Review results"}
          </Link>
        </Button>
        {canReopen(clock) && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run("Couldn't reopen the tournament", () =>
                reopenClockAction(clock.id),
              )
            }
          >
            Reopen
          </Button>
        )}
      </div>
    </div>
  );
}

// The control screen's end of the tournament: End tournament while it
// runs, then the results.
function FinishPanel({ clock, players, members, nowMs, applyRow }: Props) {
  const { run, isPending } = useFinishAction({ players, applyRow });
  if (clock.status === "setup") return null;

  const { entrants } = players;
  const names = entrantNames(entrants, members);
  const winner =
    clock.status === "finished"
      ? entrants.find(({ finish_place }) => finish_place === 1)
      : entrants.find(({ busted_at }) => busted_at === null);
  const winnerName = winner ? (names.get(winner.id) ?? null) : null;

  const plan = planFinishClock(clock, entrants, nowMs);
  const refusal = plan.ok ? null : finishRefusalMessage(plan.reason);

  return (
    <Card className="py-4">
      <CardContent>
        {clock.status === "finished" ? (
          <Finished
            clock={clock}
            winnerName={winnerName}
            run={run}
            isPending={isPending}
          />
        ) : (
          <EndTournament
            clock={clock}
            winnerName={winnerName}
            refusal={refusal}
            run={run}
            isPending={isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default FinishPanel;
