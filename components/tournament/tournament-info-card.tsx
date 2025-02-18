import React from "react";
import { Card, CardTitle } from "../ui/card";
import { Member, Tournament, TournamentSession } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import Link from "next/link";

interface SessionsWithMember extends TournamentSession {
  member: Member;
  session: TournamentSession;
}

interface Props {
  isAdmin?: boolean;
  sessions: SessionsWithMember[] | null;
  tournament: Tournament;
}

function TournamentInfo({ isAdmin = false, sessions, tournament }: Props) {
  const tournamentWinner =
    sessions && sessions.length > 0
      ? sessions.sort((a, b) => b.place - a.place)[0].member.first_name
      : null;
  return (
    <Card>
      <CardTitle>Tournament Info</CardTitle>
      {isAdmin && (
        <Link
          href={`/admin/stats/tournaments/${tournament.id}/edit`}
          className="text-base text-white underline absolute top-3 right-4">
          Edit
        </Link>
      )}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 justify-center items-center">
          <h3 className="text-sm text-muted md:text-base">Winner</h3>
          {tournamentWinner ? <></> : <p>Winner not Found</p>}
        </div>
        <div className="grid w-full grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 items-start justify-center">
            <p className="text-sm text-muted md:text-base">Prize Pool</p>
            <p className="text-lg font-semibold md:text-xl">
              {formatMoney(tournament.money_in_play)}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-sm text-muted md:text-base">Places Paid</p>
            <p className="text-lg font-semibold md:text-xl">
              {tournament.places_payed}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end justify-center">
            <p className="text-sm text-muted md:text-base">Players</p>
            <p className="text-lg font-semibold md:text-xl">
              {tournament.player_count}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-start justify-center">
            <p className="text-sm text-muted md:text-base">Rebuys</p>
            <p className="text-lg font-semibold md:text-xl">
              {tournament.rebuys}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-sm text-muted md:text-base">Total Buy-Ins</p>
            <p className="text-lg font-semibold md:text-xl">
              {tournament.rebuys + tournament.buy_ins}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end justify-center">
            <p className="text-sm text-muted md:text-base">Date</p>
            <p className="text-lg font-semibold md:text-xl">
              {new Date(tournament.date).toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TournamentInfo;
