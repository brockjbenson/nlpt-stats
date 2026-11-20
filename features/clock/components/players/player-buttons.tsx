"use client";

import { Button } from "@/components/ui/button";
import {
  rebuyEntrantAction,
  removeEntrantAction,
  undoBustAction,
} from "@/features/clock/actions/entrants";
import type { RunPlayerAction } from "@/features/clock/components/players/use-player-action";
import { planRebuy } from "@/features/clock/lib/entrants";
import {
  canRemoveEntrant,
  type PlayerRow,
  planBustPlayer,
  planUndoPlayer,
} from "@/features/clock/lib/players";
import type {
  ClockEntrant,
  ClockKnockout,
  TournamentClock,
} from "@/features/clock/types";
import { Trash2 } from "lucide-react";

// planBustPlayer only uses the time for the bust's timestamp; whether a
// bust is allowed doesn't depend on it.
const ANY_TIME_MS = 0;

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  player: PlayerRow;
  run: RunPlayerAction;
  isPending: boolean;
};

// Rebuy, for a player still in or (as a re-entry) the most recent bust,
// when the rebuy rules allow it.
function RebuyButton({ clock, entrants, player, run, isPending }: Props) {
  const { id } = player.entrant;
  if (!planRebuy(clock, entrants, id).ok) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        run("Couldn't rebuy", () => rebuyEntrantAction(clock.id, id))
      }
    >
      Rebuy
    </Button>
  );
}

// A player still in: Rebuy, Bust (opens the bust dialog) and, for a
// sign-up mistake, remove. Each shows only when it's allowed.
export function InPlayerButtons({
  knockouts,
  onBust,
  ...props
}: Props & { knockouts: ClockKnockout[]; onBust: () => void }) {
  const { clock, entrants, player, run, isPending } = props;
  const { entrant, name } = player;
  const canBust = planBustPlayer(
    clock,
    entrants,
    entrant.id,
    null,
    ANY_TIME_MS,
  ).ok;
  const canRemove =
    clock.status !== "finished" && canRemoveEntrant(entrant, knockouts);

  return (
    <>
      <RebuyButton {...props} />
      {canBust && (
        <Button
          size="sm"
          variant="outline"
          className="border-red-600/60 text-red-500"
          disabled={isPending}
          onClick={onBust}
        >
          Bust
        </Button>
      )}
      {canRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="size-9"
          disabled={isPending}
          aria-label={`Remove ${name}`}
          title={`Remove ${name}`}
          onClick={() =>
            run("Couldn't remove", () =>
              removeEntrantAction(clock.id, entrant.id),
            )
          }
        >
          <Trash2 size={16} className="text-red-600" />
        </Button>
      )}
    </>
  );
}

// A player who is out: Rebuy (re-entry) and Undo, for the most recent bust.
export function OutPlayerButtons(props: Props) {
  const { clock, entrants, player, run, isPending } = props;
  const { id } = player.entrant;
  const canUndo = planUndoPlayer(clock, entrants, id).ok;

  return (
    <>
      <RebuyButton {...props} />
      {canUndo && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            run("Couldn't undo the bust", () => undoBustAction(clock.id, id))
          }
        >
          Undo
        </Button>
      )}
    </>
  );
}
