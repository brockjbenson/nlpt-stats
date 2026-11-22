"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bustEntrantAction } from "@/features/clock/actions/entrants";
import type { MemberOption } from "@/features/clock/data/entrants";
import AddPlayersDrawer from "@/features/clock/components/players/add-players-drawer";
import BustDialog from "@/features/clock/components/players/bust-dialog";
import {
  InPlayerButtons,
  OutPlayerButtons,
} from "@/features/clock/components/players/player-buttons";
import EditPlayerDrawer from "@/features/clock/components/players/edit-player-drawer";
import PlayerRow from "@/features/clock/components/players/player-row";
import { usePlayerAction } from "@/features/clock/components/players/use-player-action";
import type { LivePlayers } from "@/features/clock/hooks/use-entrants";
import {
  addRefusalMessage,
  rebuyRefusalMessage,
} from "@/features/clock/lib/player-messages";
import {
  addPlayersBlocked,
  entrantNames,
  latestKnockouts,
  listPlayers,
  type PlayerRow as PlayerRowData,
} from "@/features/clock/lib/players";
import type { ClockKnockout, TournamentClock } from "@/features/clock/types";
import { useState } from "react";

type Props = {
  clock: TournamentClock;
  players: LivePlayers;
  // Visible members and any hidden member already playing.
  members: MemberOption[];
};

// Who knocked each player out in their latest bust, by entrant id.
function latestKnockers(knockouts: ClockKnockout[]): Map<string, string> {
  const knockers = new Map<string, string>();
  latestKnockouts(knockouts).forEach(({ entrant_id, knocked_out_by }) => {
    if (knocked_out_by) knockers.set(entrant_id, knocked_out_by);
  });
  return knockers;
}

// One line under the header when buttons are missing for a common reason.
function buttonsNote(
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
  return isInTheMoney
    ? rebuyRefusalMessage("in_the_money", clock.max_rebuys)
    : null;
}

// The control screen's players: add them, bust them (with who knocked
// them out), undo the latest bust, rebuy, and remove sign-up mistakes.
function PlayersCard({ clock, players, members }: Props) {
  const { entrants, knockouts, applyResult } = players;
  const { run, isPending } = usePlayerAction(applyResult);
  const [busting, setBusting] = useState<PlayerRowData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const names = entrantNames(entrants, members);
  const { left, out } = listPlayers(entrants, knockouts, names);
  const knockers = latestKnockers(knockouts);
  const addBlockedReason = addPlayersBlocked(clock, entrants);
  const note = buttonsNote(clock, left, entrants.length);
  const canEdit = clock.status !== "finished";
  // The drawer closes if its player is removed or the clock finishes.
  const openId =
    canEdit && entrants.some(({ id }) => id === editingId) ? editingId : null;
  // Forget a closed drawer's player, so it can't pop open again if the
  // clock is reopened on another screen.
  if (editingId !== null && openId === null) setEditingId(null);
  const editHandler = (id: string) =>
    canEdit ? () => setEditingId(id) : undefined;
  const buttonProps = { clock, entrants, run, isPending };

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
        {!addBlockedReason && (
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
        {addBlockedReason === "player_out" && (
          <p className="text-xs text-muted">
            {addRefusalMessage(addBlockedReason)}
          </p>
        )}
        {note && <p className="text-xs text-muted">{note}</p>}
        {entrants.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            No players yet. Add the people playing.
          </p>
        )}

        {left.length > 0 && (
          <ul className="divide-y">
            {left.map((player) => (
              <PlayerRow
                key={player.entrant.id}
                player={player}
                onEdit={editHandler(player.entrant.id)}
              >
                <InPlayerButtons
                  {...buttonProps}
                  player={player}
                  knockouts={knockouts}
                  onBust={() => setBusting(player)}
                />
              </PlayerRow>
            ))}
          </ul>
        )}

        {out.length > 0 && (
          <>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Out
            </p>
            <ul className="divide-y">
              {out.map((player) => {
                const knocker = knockers.get(player.entrant.id);
                return (
                  <PlayerRow
                    key={player.entrant.id}
                    player={player}
                    knockedOutBy={knocker ? names.get(knocker) : null}
                    onEdit={editHandler(player.entrant.id)}
                  >
                    <OutPlayerButtons {...buttonProps} player={player} />
                  </PlayerRow>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>

      <EditPlayerDrawer
        clock={clock}
        entrants={entrants}
        knockouts={knockouts}
        names={names}
        entrantId={openId}
        onClose={() => setEditingId(null)}
        run={run}
        isPending={isPending}
      />

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
