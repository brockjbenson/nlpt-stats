import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { CashSession } from "@/utils/types";
import {
  formatMoney,
  getCumulativeCashStats,
  getLargestWins,
  getNetProfitLeaders,
  getPOYPointsLeaders,
} from "@/utils/utils";
import { Medal } from "lucide-react";
import React from "react";
import StatsTable from "./_components/stats-table";
import CashGameTable from "@/components/cashgames/cashgame-table";

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
    .order("firstName", { ascending: true });

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const { data: sessions, error: sessionError } = await db
    .from("cashSession")
    .select(
      `
    *,
    week:weekId(weekNumber)
  `
    )
    .in("memberId", memberIds)
    .order("createdAt", { ascending: false })
    .eq("seasonId", season[0].id);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  const rankedPOYMembers = getPOYPointsLeaders(sessions, memberIds, members);
  const rankedNetProfitLeaders = getNetProfitLeaders(
    sessions,
    memberIds,
    members
  );
  const largestWinsLeaders = getLargestWins(sessions, memberIds, members);

  const cumulativeCashStats = getCumulativeCashStats(
    sessions,
    memberIds,
    members
  );

  return (
    <>
      <h1>{season[0].year} Stats</h1>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-12 gap-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">POY Points Leaders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {rankedPOYMembers.map((member, index) => {
                if (index < 3) {
                  return (
                    <li
                      className="flex items-center justify-between"
                      key={member.id}>
                      <span className="flex font-semibold text-lg items-center gap-2">
                        {index === 0 ? (
                          <Medal className="text-yellow-500" size={16} />
                        ) : index === 1 ? (
                          <Medal className="text-neutral-400" size={16} />
                        ) : (
                          <Medal className="text-orange-700" size={16} />
                        )}
                        {member.name}
                      </span>
                      <span className="font-semibold text-xl">
                        {member.totalPOYPoints}
                      </span>
                    </li>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Profit Leaders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {rankedNetProfitLeaders.map((member, index) => {
                if (index < 3) {
                  return (
                    <li
                      className="flex items-center justify-between"
                      key={member.id}>
                      <span className="flex font-semibold text-lg items-center gap-2">
                        {index === 0 ? (
                          <Medal className="text-yellow-500" size={16} />
                        ) : index === 1 ? (
                          <Medal className="text-neutral-400" size={16} />
                        ) : (
                          <Medal className="text-orange-700" size={16} />
                        )}
                        {member.name}
                      </span>
                      <span className="font-semibold text-green-500 text-xl">
                        {formatMoney(member.totalNetProfit)}
                      </span>
                    </li>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Largest Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {largestWinsLeaders.map((member, index) => {
                if (index < 3) {
                  return (
                    <li
                      className="flex items-center justify-between"
                      key={member.memberId + member.weekNumber}>
                      <span className="flex font-semibold text-lg items-center gap-2">
                        {index === 0 ? (
                          <Medal className="text-yellow-500" size={16} />
                        ) : index === 1 ? (
                          <Medal className="text-neutral-400" size={16} />
                        ) : (
                          <Medal className="text-orange-700" size={16} />
                        )}
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-500 text-xl">
                          {formatMoney(member.netProfit)}
                        </span>
                        <span className="text-sm text-muted">
                          (W{member.weekNumber})
                        </span>
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-8 font-semibold text-lg">Cash Stats</h2>
      <StatsTable cumulativeCashStats={cumulativeCashStats} />
      <CashGameTable members={members} seasonId={season[0].id} />
    </>
  );
}

export default Page;
