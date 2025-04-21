import React from "react";
import { Card, CardTitle } from "../ui/card";
import { MajorData } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import Link from "next/link";
import MemberImage from "../members/member-image";

interface Props {
  isAdmin?: boolean;
  data: MajorData;
}

function TournamentInfo({ isAdmin = false, data }: Props) {
  const sessions = data.sessions;
  const tournamentWinner = sessions.find((session) => session.place === 1);
  return (
    <Card>
      <CardTitle>Tournament Info</CardTitle>
      {isAdmin && (
        <Link
          href={`/admin/stats/tournaments/${data.id}/edit`}
          className="text-base text-white underline absolute top-3 right-4">
          Edit
        </Link>
      )}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 justify-center items-center">
          <h3 className="text-sm text-muted md:text-base">Winner</h3>
          {tournamentWinner ? (
            <Link
              href={`/members/${tournamentWinner.member_id}`}
              className="grid grid-cols-[50px_1fr] gap-2 items-center">
              <MemberImage
                src={tournamentWinner.portrait_url}
                alt={tournamentWinner.first_name}
              />
              <p className="text-lg md:text-xl font-bold">
                {tournamentWinner.first_name} {tournamentWinner.last_name}
              </p>
            </Link>
          ) : (
            <p>Winner not Found</p>
          )}
        </div>
        <div className="grid w-full grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 items-start justify-center">
            <p className="text-sm text-muted md:text-base">Prize Pool</p>
            <p className="text-lg font-semibold md:text-xl">
              {formatMoney(data.prize_pool)}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-sm text-muted md:text-base">Places Paid</p>
            <p className="text-lg font-semibold md:text-xl">
              {data.places_payed}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end justify-center">
            <p className="text-sm text-muted md:text-base">Players</p>
            <p className="text-lg font-semibold md:text-xl">{data.players}</p>
          </div>
          <div className="flex flex-col gap-1 items-start justify-center">
            <p className="text-sm text-muted md:text-base">Rebuys</p>
            <p className="text-lg font-semibold md:text-xl">{data.rebuys}</p>
          </div>
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-sm text-muted md:text-base">Total Buy-Ins</p>
            <p className="text-lg font-semibold md:text-xl">
              {data.total_buy_ins}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end justify-center">
            <p className="text-sm text-muted md:text-base">Date</p>
            <p className="text-lg font-semibold md:text-xl">
              {new Date(data.date).toLocaleDateString("en-US", {
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
