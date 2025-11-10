"use client";
import MemberImage from "@/components/members/member-image";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Member, POYData, SeasonCashStats } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import Link from "next/link";
import React from "react";

interface Props {
  seasonStats: SeasonCashStats[];
  poyData: POYData[];
  members: Member[];
}

function StatsOverview({ seasonStats, poyData, members }: Props) {
  const netProfitLeaders = [...seasonStats].sort(
    (a, b) => b.net_profit - a.net_profit
  );
  const winsLeaders = [...seasonStats].sort((a, b) => b.wins - a.wins);
  const grossProfitLeaders = [...seasonStats].sort(
    (a, b) => b.gross_profit - a.gross_profit
  );
  const winPercentageLeaders = [...seasonStats].sort(
    (a, b) => b.win_percentage - a.win_percentage
  );
  const sessionAverageLeaders = [...seasonStats].sort(
    (a, b) => b.session_avg - a.session_avg
  );

  return (
    <>
      <div className="w-full px-2 hidden mt-8 md:grid md:grid-cols-2 lg:grid-cols-3 mb-4 md:mb-8 gap-8">
        <Card className={cn("w-full")}>
          <CardTitle>POY Points</CardTitle>
          <div className="flex flex-col gap-4">
            {poyData
              .sort((a, b) => b.cash_points - a.cash_points)
              .slice(0, 3)
              .map((data, index) => {
                const memberData = members.find(
                  (member) => member.id === data.member_id
                );
                return (
                  <div
                    className="flex items-center justify-between"
                    key={data.member_id + data.cash_points + index + "poy"}>
                    <Link
                      href={`/members/${memberData?.id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        className="w-10 h-10"
                        src={memberData?.portrait_url || ""}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

                    <p className="font-semibold text-lg md:text-xl">
                      {data.cash_points.toFixed(2)}
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>
        <Card className={cn("w-full")}>
          <CardTitle>Net Profit</CardTitle>
          <div className="flex flex-col gap-4">
            {netProfitLeaders.slice(0, 3).map((data, index) => (
              <div
                className="flex items-center justify-between"
                key={data.member_id + data.net_profit + index + "net"}>
                <Link
                  href={`/members/${data.member_id}`}
                  className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={data.portrait_url}
                    alt={data.first_name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {data.first_name}
                  </h3>
                </Link>

                <p
                  className={cn(
                    getProfitTextColor(data.net_profit),
                    "font-semibold text-lg md:text-xl"
                  )}>
                  {formatMoney(data.net_profit)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("w-full")}>
          <CardTitle>Wins</CardTitle>
          <div className="flex flex-col gap-4">
            {winsLeaders.slice(0, 3).map((data, index) => (
              <div
                className="flex items-center justify-between"
                key={data.wins + data.member_id + index + "wins"}>
                <Link
                  href={`/members/${data.member_id}`}
                  className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={data.portrait_url}
                    alt={data.first_name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {data.first_name}
                  </h3>
                </Link>

                <p className="font-semibold text-lg md:text-xl">{data.wins}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("w-full")}>
          <CardTitle>Gross Profit</CardTitle>
          <div className="flex flex-col gap-4">
            {grossProfitLeaders.slice(0, 3).map((data, index) => (
              <div
                className="flex items-center justify-between"
                key={data.gross_profit + data.member_id + index + "gross"}>
                <Link
                  href={`/members/${data.member_id}`}
                  className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={data.portrait_url}
                    alt={data.first_name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {data.first_name}
                  </h3>
                </Link>

                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    getProfitTextColor(data.gross_profit)
                  )}>
                  {formatMoney(data.gross_profit)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("w-full")}>
          <CardTitle>Win Percentage</CardTitle>
          <div className="flex flex-col gap-4">
            {winPercentageLeaders.slice(0, 3).map((data, index) => (
              <div
                className="flex items-center justify-between"
                key={data.win_percentage + data.member_id + index + "gross"}>
                <Link
                  href={`/members/${data.member_id}`}
                  className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={data.portrait_url}
                    alt={data.first_name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {data.first_name}
                  </h3>
                </Link>

                <p className={cn("font-semibold text-lg md:text-xl")}>
                  {data.win_percentage.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("w-full")}>
          <CardTitle>Session Average</CardTitle>
          <div className="flex flex-col gap-4">
            {sessionAverageLeaders.slice(0, 3).map((data, index) => (
              <div
                className="flex items-center justify-between"
                key={data.session_avg + data.member_id + index + "gross"}>
                <Link
                  href={`/members/${data.member_id}`}
                  className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={data.portrait_url}
                    alt={data.first_name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {data.first_name}
                  </h3>
                </Link>

                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    getProfitTextColor(data.sessions_played)
                  )}>
                  {formatMoney(data.session_avg)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default StatsOverview;
