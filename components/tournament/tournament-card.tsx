import React from "react";
import { Card } from "../ui/card";
import Link from "next/link";
import { formatMoney } from "@/utils/utils";
import { Member, Tournament, TournamentSession } from "@/utils/types";

interface SessionWithMember extends TournamentSession {
  member: Member;
  session: TournamentSession;
}

interface Props {
  isAdmin?: boolean;
  tournament: Tournament;
  sessions: SessionWithMember[] | null;
}

function TournamentCard({ tournament, isAdmin, sessions }: Props) {
  const tournamentWinner =
    sessions && sessions.length > 0
      ? sessions.sort((a, b) => b.place - a.place)[0]
      : null;
  return (
    <Card key={tournament.id} className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">
          <Link
            className="underline"
            href={
              isAdmin
                ? `/admin/stats/tournaments/${tournament.id}`
                : `/stats/tournaments/${tournament.id}`
            }>
            {tournament.name}
          </Link>
        </h2>
        <p className="text-xs text-muted">
          {new Date(tournament.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-col gap-2 justify-center items-center">
        <h3 className="text-muted text-sm">Winner</h3>
        {tournamentWinner ? (
          <p>{tournamentWinner.member.first_name}</p>
        ) : (
          <p>Winner not Found</p>
        )}
      </div>
      <div className="grid grid-cols-3">
        <div className="flex flex-col items-start">
          <p className="text-xs text-muted">Prize Pool</p>
          <p className="text-base font-semibold">
            {formatMoney(tournament.money_in_play)}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted">Total Buy-Ins</p>
          <p className="text-base font-semibold">
            {tournament.rebuys + tournament.buy_ins}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-muted">Players</p>
          <p className="text-base font-semibold">{tournament.player_count}</p>
        </div>
      </div>
    </Card>
  );
}

export default TournamentCard;
