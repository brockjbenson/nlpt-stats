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
import Image from "next/image";

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
                    <figure>
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={`${member.name}`}
                          width={100}
                          height={100}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="rounded-full bg-neutral-800 flex items-center justify-center w-full aspect-square overflow-hidden">
                          <User2
                            className="fill-muted-foreground relative top-2 w-[90%] h-[90%]"
                            stroke="neutral-500"
                          />
                        </div>
                      )}
                    </figure>
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
                      <figure>
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={`${member.name}`}
                            width={100}
                            height={100}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="rounded-full bg-neutral-800 flex items-center justify-center w-full aspect-square overflow-hidden">
                            <User2
                              className="fill-muted-foreground relative top-2 w-[90%] h-[90%]"
                              stroke="neutral-500"
                            />
                          </div>
                        )}
                      </figure>
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
                      <figure>
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={`${member.name}`}
                            width={100}
                            height={100}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="rounded-full bg-neutral-800 flex items-center justify-center w-full aspect-square overflow-hidden">
                            <User2
                              className="fill-muted-foreground relative top-2 w-[90%] h-[90%]"
                              stroke="neutral-500"
                            />
                          </div>
                        )}
                      </figure>
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
                        <figure>
                          {data.member.portraitUrl ? (
                            <Image
                              src={data.member.portraitUrl}
                              alt={
                                data.member.firstName +
                                " " +
                                data.member.lastName
                              }
                              width={50}
                              height={50}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="rounded-full bg-neutral-800 flex items-center justify-center w-full aspect-square overflow-hidden">
                              <User2
                                className="fill-muted-foreground relative top-2 w-[90%] h-[90%]"
                                stroke="neutral-500"
                              />
                            </div>
                          )}
                        </figure>
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.firstName} {data.member.lastName}
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
                        <figure>
                          {data.member.portraitUrl ? (
                            <Image
                              src={data.member.portraitUrl}
                              alt={
                                data.member.firstName +
                                " " +
                                data.member.lastName
                              }
                              width={50}
                              height={50}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="rounded-full bg-neutral-800 flex items-center justify-center w-full aspect-square overflow-hidden">
                              <User2
                                className="fill-muted-foreground relative top-2 w-[90%] h-[90%]"
                                stroke="neutral-500"
                              />
                            </div>
                          )}
                        </figure>
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.firstName} {data.member.lastName}
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
                        <figure>
                          <Image
                            src={data.member.portraitUrl || ""}
                            alt={
                              data.member.firstName + " " + data.member.lastName
                            }
                            width={50}
                            height={50}
                            className="rounded-full"
                          />
                        </figure>
                        <div>
                          <span className="flex text-base items-center gap-2">
                            {data.member.firstName} {data.member.lastName}
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
      <CashGameTable members={members} seasonId={season[0].id} />
    </>
  );
}

export default Page;
