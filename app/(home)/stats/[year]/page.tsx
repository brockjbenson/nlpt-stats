import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { CashSession } from "@/utils/types";
import {
  formatMoney,
  getCumulativeCashStats,
  getLargestWins,
  getNetProfitLeaders,
  getPOYPointsLeaders,
  getProfitTextColor,
  getRankTextColor,
} from "@/utils/utils";
import { Medal, User2 } from "lucide-react";
import React from "react";
import StatsTable from "./_components/stats-table";
import CashGameTable from "@/components/cashgames/cashgame-table";
import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";

interface Params {
  params: Promise<{ year: number }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const year = await params;
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year.year);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  const { data: members, error: memberError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*), week:week_id(*)`)
    .eq("season_id", season[0].id);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

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
      <h1 className="mb-8">{season[0].year} Stats</h1>
      <h2 className="w-full text-xl text-left mb-4">Stats Leaders</h2>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12 gap-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>POY Points</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...rankedPOYMembers].slice(0, 3).map((member, index) => (
              <div
                className="flex items-center justify-between"
                key={member.id + member.totalPOYPoints}
              >
                <div className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={member.image}
                    alt={member.name}
                  />
                  <h3 className="text-xl font-medium">{member.name}</h3>
                </div>

                <p className="font-semibold text-xl">{member.totalPOYPoints}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...rankedNetProfitLeaders].slice(0, 3).map((member, index) => (
              <div
                className="flex items-center justify-between"
                key={member.id + member.totalNetProfit}
              >
                <div className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={member.image}
                    alt={member.name}
                  />
                  <h3 className="text-xl font-medium">{member.name}</h3>
                </div>

                <p
                  className={cn(
                    getProfitTextColor(member.totalNetProfit),
                    "font-semibold text-xl"
                  )}
                >
                  {formatMoney(member.totalNetProfit)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Largest Wins</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...largestWinsLeaders].slice(0, 3).map((member, index) => (
              <div
                className="flex items-center justify-between"
                key={member.memberId + member.netProfit + member.weekNumber}
              >
                <div className="flex items-center gap-4">
                  <MemberImage
                    className="w-10 h-10"
                    src={member.image || ""}
                    alt={member.name}
                  />
                  <h3 className="text-xl font-medium">{member.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-semibold text-green-500 text-xl">
                    {formatMoney(member.netProfit)}
                  </p>
                  <p className="text-sm text-muted">(W{member.weekNumber})</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Avg Win</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...cumulativeCashStats]
              .sort((a, b) => b.averageWin - a.averageWin)
              .slice(0, 3)
              .map((data) => (
                <div
                  className="flex items-center justify-between"
                  key={data.averageWin + data.member.id}
                >
                  <div className="flex items-center gap-4">
                    <MemberImage
                      className="w-10 h-10"
                      src={data.member.portrait_url}
                      alt={data.member.first_name}
                    />
                    <h3 className="text-xl font-medium">
                      {data.member.first_name} {data.member.last_name}
                    </h3>
                  </div>

                  <p className="font-semibold text-green-500 text-xl">
                    {formatMoney(data.averageWin)}
                  </p>
                </div>
              ))}
          </div>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Wins</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {[...cumulativeCashStats]
              .sort((a, b) => b.wins - a.wins)
              .slice(0, 3)
              .map((data) => (
                <div
                  className="flex items-center justify-between"
                  key={data.averageWin + data.member.id}
                >
                  <div className="flex items-center gap-4">
                    <MemberImage
                      className="w-10 h-10"
                      src={data.member.portrait_url}
                      alt={data.member.first_name}
                    />
                    <h3 className="text-xl font-medium">
                      {data.member.first_name} {data.member.last_name}
                    </h3>
                  </div>

                  <p className="font-semibold text-xl">{data.wins}</p>
                </div>
              ))}
          </div>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Best Win Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[...cumulativeCashStats]
                .sort((a, b) => b.winPercentage - a.winPercentage)
                .slice(0, 3)
                .map((data) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.averageWin}
                  >
                    <div className="flex items-center gap-4">
                      <MemberImage
                        className="w-10 h-10"
                        src={data.member.portrait_url}
                        alt={data.member.first_name}
                      />
                      <h3 className="text-xl font-medium">
                        {data.member.first_name} {data.member.last_name}
                      </h3>
                    </div>

                    <p className="font-semibold text-xl">
                      {data.winPercentage.toFixed(2)}%
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-4 font-semibold text-xl w-full text-left">
        Cash Stats
      </h2>
      <StatsTable cumulativeCashStats={cumulativeCashStats} />
      <CashGameTable
        members={members}
        year={season[0].year}
        seasonId={season[0].id}
      />
    </>
  );
}

export default Page;
