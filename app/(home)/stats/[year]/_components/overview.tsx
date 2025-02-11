"use client";
import MemberImage from "@/components/members/member-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CashSession, CashSessionWithWeek, Member, Week } from "@/utils/types";
import {
  formatMoney,
  getCumulativeCashStats,
  getLargestWins,
  getNetProfitLeaders,
  getPOYPointsLeaders,
  getProfitTextColor,
} from "@/utils/utils";
import { Medal } from "lucide-react";
import { PiRanking } from "react-icons/pi";

import React from "react";
import { FaMoneyBill } from "react-icons/fa6";

interface ExtendedCashSessions extends CashSession {
  member: Member;
  week: Week;
  session: CashSession;
}

interface Props {
  members: Member[];
  memberIds: string[];
  sessions: ExtendedCashSessions[];
}

function StatsOverview({ members, memberIds, sessions }: Props) {
  const [activeStat, setActiveStat] = React.useState("poy");

  const sessionSortedByWeek = sessions.sort(
    (a, b) => a.week.week_number - b.week.week_number
  );

  const rankedPOYMembers = getPOYPointsLeaders(
    sessionSortedByWeek,
    memberIds,
    members
  );
  const rankedNetProfitLeaders = getNetProfitLeaders(
    sessions,
    memberIds,
    members
  );
  const largestWinsLeaders = getLargestWins(sessionSortedByWeek, members);

  const cumulativeCashStats = getCumulativeCashStats(
    sessionSortedByWeek,
    memberIds,
    members
  );
  return (
    <>
      <nav className="md:hidden mb-4 flex w-full">
        <ul className="grid grid-cols-4 w-full">
          <li
            className={cn(
              "w-full py-4 items-center gap-2 border-b border-neutral-500 whitespace-nowrap",
              activeStat === "poy" && "text-primary border-primary"
            )}>
            <button
              className="flex w-full gap-2 items-center justify-center whitespace-nowrap"
              onClick={() => setActiveStat("poy")}>
              Points
              <PiRanking className="w-4 h-4" />
            </button>
          </li>
          <li
            className={cn(
              "w-full py-4 items-center gap-2 border-b border-neutral-500 whitespace-nowrap",
              activeStat === "wins" && "text-primary border-primary"
            )}>
            <button
              className="flex w-full gap-2 items-center justify-center whitespace-nowrap"
              onClick={() => setActiveStat("wins")}>
              Wins
              <Medal className="w-4 h-4" />
            </button>
          </li>
          <li
            className={cn(
              "w-full py-4 items-center gap-2 border-b border-neutral-500 whitespace-nowrap",
              activeStat === "net_profit" && "text-primary border-primary"
            )}>
            <button
              className="flex w-full gap-2 items-center justify-center whitespace-nowrap"
              onClick={() => setActiveStat("net_profit")}>
              Net
              <FaMoneyBill className="w-4 h-4" />
            </button>
          </li>
          <li
            className={cn(
              "w-full py-4 items-center gap-2 border-b border-neutral-500 whitespace-nowrap",
              activeStat === "gross_profit" && "text-primary border-primary"
            )}>
            <button
              className="flex w-full gap-2 items-center justify-center whitespace-nowrap"
              onClick={() => setActiveStat("gross_profit")}>
              Gross
              <FaMoneyBill className="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
      <div className="grid w-full px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4 gap-8">
        <Card className={cn("w-full", activeStat !== "poy" && "max-md:hidden")}>
          <CardHeader>
            <CardTitle>POY Points</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...rankedPOYMembers].slice(0, 3).map((member, index) => (
              <div
                className="flex items-center justify-between"
                key={member.id + member.totalPOYPoints + index + "poy"}>
                <div className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={member.image}
                    alt={member.name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {member.name}
                  </h3>
                </div>

                <p className="font-semibold text-lg md:text-xl">
                  {member.totalPOYPoints}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card
          className={cn(
            "w-full",
            activeStat !== "net_profit" && "max-md:hidden"
          )}>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...rankedNetProfitLeaders].slice(0, 3).map((member, index) => (
              <div
                className="flex items-center justify-between"
                key={member.id + member.totalNetProfit + index + "net"}>
                <div className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={member.image}
                    alt={member.name}
                  />
                  <h3 className="text-base md:text-xl font-medium">
                    {member.name}
                  </h3>
                </div>

                <p
                  className={cn(
                    getProfitTextColor(member.totalNetProfit),
                    "font-semibold text-lg md:text-xl"
                  )}>
                  {formatMoney(member.totalNetProfit)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card
          className={cn("w-full", activeStat !== "wins" && "max-md:hidden")}>
          <CardHeader>
            <CardTitle>Wins</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...cumulativeCashStats]
              .sort((a, b) => b.wins - a.wins)
              .slice(0, 3)
              .map((data, index) => (
                <div
                  className="flex items-center justify-between"
                  key={data.wins + data.member.id + index + "wins"}>
                  <div className="flex items-center gap-4">
                    <MemberImage
                      className="w-10 h-10"
                      src={data.member.portrait_url}
                      alt={data.member.first_name}
                    />
                    <h3 className="text-base md:text-xl font-medium">
                      {data.member.first_name} {data.member.last_name}
                    </h3>
                  </div>

                  <p className="font-semibold text-lg md:text-xl">
                    {data.wins}
                  </p>
                </div>
              ))}
          </div>
        </Card>
        <Card
          className={cn(
            "w-full",
            activeStat !== "gross_profit" && "max-md:hidden"
          )}>
          <CardHeader>
            <CardTitle>Gross Profit</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...cumulativeCashStats]
              .sort((a, b) => b.grossProfit - a.grossProfit)
              .slice(0, 3)
              .map((data, index) => (
                <div
                  className="flex items-center justify-between"
                  key={data.grossProfit + data.member.id + index + "gross"}>
                  <div className="flex items-center gap-4">
                    <MemberImage
                      className="w-10 h-10"
                      src={data.member.portrait_url}
                      alt={data.member.first_name}
                    />
                    <h3 className="text-base md:text-xl font-medium">
                      {data.member.first_name} {data.member.last_name}
                    </h3>
                  </div>

                  <p
                    className={cn(
                      "font-semibold text-lg md:text-xl",
                      getProfitTextColor(data.grossProfit)
                    )}>
                    {formatMoney(data.grossProfit)}
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
