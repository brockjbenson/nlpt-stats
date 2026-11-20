"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bustEntrantAction,
  rebuyEntrantAction,
  removeEntrantAction,
  undoBustAction,
} from "@/features/clock/actions/entrants";
import type { MemberOption } from "@/features/clock/data/entrants";
import AddPlayersDrawer from "@/features/clock/components/players/add-players-drawer";
import BustDialog from "@/features/clock/components/players/bust-dialog";
import PlayerRow from "@/features/clock/components/players/player-row";
import { usePlayerAction } from "@/features/clock/components/players/use-player-action";
import type { LivePlayers } from "@/features/clock/hooks/use-entrants";
import { planRebuy } from "@/features/clock/lib/entrants";
import {
  addRefusalMessage,
  rebuyRefusalMessage,
} from "@/features/clock/lib/player-messages";
import {
  addPlayersBlocked,
  canRemoveEntrant,
  entrantNames,
  listPlayers,
  type PlayerRow as PlayerRowData,
  planBustPlayer,
  planUndoPlayer,
} from "@/features/clock/lib/players";
import type { ClockKnockout, TournamentClock } from "@/features/clock/types";
import { Trash2 } from "lucide-react";
import { useState } from "react";

// planBustPlayer only uses the time for the bust's timestamp; whether a
// bust is allowed doesn't depend on it.
const ANY_TIME_MS = 0;

type Props = {
  clock: TournamentClock;
  players: LivePlayers;
  // Visible members and any hidden member already playing.
  members: MemberOption[];
};

// Who knocked each player out in their latest bust, by entrant id.
function latestKnockers(knockouts: ClockKnockout[]): Map<string, string> {
  const latest = new Map<string, ClockKnockout>();
  knockouts.forEach((knockout) => {
    const current = latest.get(knockout.entrant_id);
    if (!current || knockout.busted_at >= current.busted_at) {
      latest.set(knockout.entrant_id, knockout);
    }
  });
  const knockers = new Map<string, string>();
  latest.forEach(({ entrant_id, knocked_out_by }) => {
    if (knocked_out_by) knockers.set(entrant_id, knocked_out_by);
  });
  return knockers;
}

// One line under the header when buttons are missing for a common reason.
function statusNote(
  clock: TournamentClock,
  left: PlayerRowData[],
  entrantCount: number,
): string | null {
  if (entrantCount === 0) return null;
  if (clock.status === "setup") {
    return "Start the clock to bust players and take rebuys.";
  }
  const isInTheMoney =
    clock.status !== "finished" && left.length <= clock.places_paid;
  return isInTheMoney ? rebuyRefusalMessage("in_the_money", 0) : null;
}

// The control screen's players: add them, bust them (with who knocked
// them out), undo the latest bust, rebuy, and remove sign-up mistakes.
function PlayersCard({ clock, players, members }: Props) {
  const { entrants, knockouts, applyResult } = players;
  const { run, isPending } = usePlayerAction(applyResult);
  const [busting, setBusting] = useState<PlayerRowData | null>(null);

  const names = entrantNames(entrants, members);
  const { left, out } = listPlayers(entrants, knockouts, names);
  const knockers = latestKnockers(knockouts);
  const blocked = addPlayersBlocked(clock, entrants);
  const note = statusNote(clock, left, entrants.length);
  const canRebuy = (id: string): boolean => planRebuy(clock, entrants, id).ok;

  const rebuy = (player: PlayerRowData): void =>
    run("Couldn't rebuy", () =>
      rebuyEntrantAction(clock.id, player.entrant.id),
    );

  const rebuyButton = (player: PlayerRowData) =>
    canRebuy(player.entrant.id) && (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => rebuy(player)}
      >
        Rebuy
      </Button>
    );

  return (
    <Card className="py-4">
      <CardHeader className="items-center justify-between gap-2">
        <CardTitle className="text-base">
          Players{" "}
          {entrants.length > 0 && (
            <span className="tabular-nums text-muted">
              {left.length} / {entrants.length}
            </span>
          )}
        </CardTitle>
        {!blocked && (
          <AddPlayersDrawer
            clock={clock}
            entrants={entrants}
            members={members.filter(({ visible }) => visible)}
            run={run}
            isPending={isPending}
          />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {blocked === "player_out" && (
          <p className="text-xs text-muted">{addRefusalMessage(blocked)}</p>
        )}
        {note && <p className="text-xs text-muted">{note}</p>}
        {entrants.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            No players yet. Add the people playing.
          </p>
        )}

        {left.length > 0 && (
          <ul className="divide-y">
            {left.map((player) => {
              const { entrant, name } = player;
              const canBust = planBustPlayer(
                clock,
                entrants,
                entrant.id,
                null,
                ANY_TIME_MS,
              ).ok;
              const canRemove =
                clock.status !== "finished" &&
                canRemoveEntrant(entrant, knockouts);
              return (
                <PlayerRow key={entrant.id} player={player}>
                  {rebuyButton(player)}
                  {canBust && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600/60 text-red-500"
                      disabled={isPending}
                      onClick={() => setBusting(player)}
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
                </PlayerRow>
              );
            })}
          </ul>
        )}

        {out.length > 0 && (
          <>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Out
            </p>
            <ul className="divide-y">
              {out.map((player) => {
                const { entrant } = player;
                const knocker = knockers.get(entrant.id);
                const canUndo = planUndoPlayer(clock, entrants, entrant.id).ok;
                return (
                  <PlayerRow
                    key={entrant.id}
                    player={player}
                    knockedOutBy={knocker ? names.get(knocker) : null}
                  >
                    {rebuyButton(player)}
                    {canUndo && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() =>
                          run("Couldn't undo the bust", () =>
                            undoBustAction(clock.id, entrant.id),
                          )
                        }
                      >
                        Undo
                      </Button>
                    )}
                  </PlayerRow>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>

      <BustDialog
        key={busting?.entrant.id ?? "closed"}
        player={busting}
        playersIn={left}
        isPending={isPending}
        onClose={() => setBusting(null)}
        onBust={(knockedOutBy) => {
          if (!busting) return;
          run(
            "Couldn't bust",
            () => bustEntrantAction(clock.id, busting.entrant.id, knockedOutBy),
            () => setBusting(null),
          );
        }}
      />
    </Card>
  );
}

export default PlayersCard;
