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
import { Medal, User2 } from "lucide-react";
import React from "react";
import StatsTable from "./_components/stats-table";
import CashGameTable from "@/components/cashgames/cashgame-table";
import MemberImage from "@/components/members/member-image";

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

  const { data: sessions, error: sessionError } = await db.rpc(
    "get_cash_sessions_by_season",
    {
      target_season_id: season[0].id,
    }
  );

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  const rankedPOYMembers = getPOYPointsLeaders(sessions, memberIds, members);
  const rankedNetProfitLeaders = getNetProfitLeaders(
    sessions,
    memberIds,
    members
  );
  const largestWinsLeaders = getLargestWins(sessions, members);

  const cumulativeCashStats = getCumulativeCashStats(
    sessions,
    memberIds,
    members
  );

  return (
    <>
      <h1>{season[0].year} Stats</h1>
      <h2 className="w-full text-lg text-left mb-4">Stats Leaders</h2>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12 gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">POY Points</CardTitle>
          </CardHeader>
          <CardContent>
            {rankedPOYMembers.map((member, index) => {
              if (index === 0) {
                return (
                  <div
                    className="grid grid-cols-[50px,1fr] gap-4"
                    key={member.id}>
                    <MemberImage src={member.image} alt={member.name} />
                    <div>
                      <span className="flex text-base items-center gap-2">
                        {member.name}
                      </span>
                      <span className="font-semibold text-xl">
                        {member.totalPOYPoints} points
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {rankedNetProfitLeaders.map((member, index) => {
                if (index === 0) {
                  return (
                    <div
                      className="grid grid-cols-[50px,1fr] gap-4"
                      key={member.id}>
                      <MemberImage src={member.image} alt={member.name} />
                      <div>
                        <span className="flex text-base items-center gap-2">
                          {member.name}
                        </span>
                        <span className="font-semibold text-green-500 text-xl">
                          {formatMoney(member.totalNetProfit)}
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">Largest Win</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {largestWinsLeaders.map((member, index) => {
                if (index === 0) {
                  return (
                    <div
                      className="grid grid-cols-[50px,1fr] gap-4"
                      key={member.memberId}>
                      <MemberImage src={member.image || ""} alt={member.name} />
                      <div>
                        <span className="flex text-base items-center gap-2">
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
                      </div>
                    </div>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">Avg Win</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {[...cumulativeCashStats]
                .sort((a, b) => b.averageWin - a.averageWin)
                .map((data, index) => {
                  if (index === 0) {
                    return (
                      <div
                        className="grid grid-cols-[50px,1fr] gap-4"
                        key={data.averageWin}>
                        <MemberImage
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.first_name} {data.member.last_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-500 text-xl">
                              {formatMoney(data.averageWin)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {[...cumulativeCashStats]
                .sort((a, b) => b.wins - a.wins)
                .map((data, index) => {
                  if (index === 0) {
                    return (
                      <div
                        className="grid grid-cols-[50px,1fr] gap-4"
                        key={data.averageWin}>
                        <MemberImage
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.first_name} {data.member.last_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xl">
                              {data.wins}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
            </ul>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-left text-base">
              Best Win Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="w-full">
              {[...cumulativeCashStats]
                .sort((a, b) => b.winStreak - a.winStreak)
                .map((data, index) => {
                  if (index === 0) {
                    return (
                      <div
                        className="grid grid-cols-[50px,1fr] gap-4"
                        key={data.averageWin}>
                        <MemberImage
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.first_name} {data.member.last_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xl">
                              {data.winStreak}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
            </ul>
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-8 font-semibold text-lg">Cash Stats</h2>
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
