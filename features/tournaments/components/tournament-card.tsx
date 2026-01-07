import React from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { formatMoney } from "@/utils/utils";
import MemberImage from "@/components/members/member-image";
import { MajorsData, Member } from "@/utils/types";

interface Props {
  isAdmin?: boolean;
  data: MajorsData;
  members: Member[] | undefined;
}

function TournamentCard({ data, isAdmin, members }: Props) {
  const winner = data.tournament_sessions.find(
    (session) => session.place === 1
  );

  const winningMember = members?.find(
    (member) => member.id === winner?.member_id
  );

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">
          <Link
            className="underline"
            href={
              isAdmin
                ? `/admin/tournaments/${data.id}`
                : `/tournaments/${data.season.year}/${data.id}`
            }>
            {data.name}
          </Link>
        </h2>
        <p className="text-xs text-muted">
          {new Date(data.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-col gap-2 justify-center items-center">
        <h3 className="text-muted text-sm">Winner</h3>
        {winner ? (
          <Link
            href={`/members/${winner.member_id}`}
            className="grid grid-cols-[50px_1fr] gap-2 items-center">
            <MemberImage
              src={winningMember?.portrait_url || ""}
              className="w-12 h-12 rounded-full"
              alt={winner.member_id}
            />
            <p className="text-lg md:text-xl font-bold">
              {winningMember?.first_name} {winningMember?.last_name}
            </p>
          </Link>
        ) : (
          <p>Winner not Found</p>
        )}
      </div>
      <div className="grid grid-cols-3">
        <div className="flex flex-col items-start">
          <p className="text-xs text-muted">Prize Pool</p>
          <p className="text-base font-semibold">
            {formatMoney(data.money_in_play)}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted">Total Buy-Ins</p>
          <p className="text-base font-semibold">
            {data.buy_ins + data.rebuys}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-muted">Players</p>
          <p className="text-base font-semibold">{data.player_count}</p>
        </div>
      </div>
    </Card>
  );
}

export default TournamentCard;
