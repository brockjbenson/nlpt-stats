import React from "react";
import { Card, CardTitle } from "../ui/card";
import { Member, Tournament, TournamentSession } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import Link from "next/link";
import MemberImage from "../members/member-image";

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
      ? [...sessions] // Create a shallow copy before sorting
          .filter((s) => s.place > 0) // Remove entries where place is 0
          .sort((a, b) => a.place - b.place)[0] // Sort by lowest place number (1st place wins)
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
          {tournamentWinner ? (
            <div className="grid grid-cols-[50px_1fr] gap-2 items-center">
              <MemberImage
                src={tournamentWinner.member.portrait_url}
                alt={tournamentWinner.member.first_name}
              />
              <p className="text-lg md:text-xl font-bold">
                {tournamentWinner.member.first_name}{" "}
                {tournamentWinner.member.last_name}
              </p>
            </div>
          ) : (
            <p>Winner not Found</p>
          )}
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
