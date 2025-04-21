import React from "react";
import { Card } from "../ui/card";
import Link from "next/link";
import { formatMoney } from "@/utils/utils";
import { MajorsData } from "@/utils/types";
import MemberImage from "../members/member-image";
import NLPTCurrency from "../nlpt-currency-svg";

interface Props {
  isAdmin?: boolean;
  data: MajorsData;
}

function TournamentCard({ data, isAdmin }: Props) {
  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">
          <Link
            className="underline"
            href={
              isAdmin
                ? `/admin/stats/tournaments/${data.id}`
                : `/stats/tournaments/${data.id}`
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
        {data.winner ? (
          <Link
            href={`/members/${data.winner.member_id}`}
            className="grid grid-cols-[50px_1fr] gap-2 items-center">
            <MemberImage
              src={data.winner.portrait_url}
              alt={data.winner.first_name}
            />
            <p className="text-lg md:text-xl font-bold">
              {data.winner.first_name} {data.winner.last_name}
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
            {formatMoney(data.prize_pool)}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted">Total Buy-Ins</p>
          <p className="text-base font-semibold">{data.total_buy_ins}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-muted">Players</p>
          <p className="text-base font-semibold">{data.players}</p>
        </div>
      </div>
    </Card>
  );
}

export default TournamentCard;
