import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { CashSessionWithMember } from "@/utils/types";
import {
  calculateAverageLoss,
  calculateAverageWin,
  calculateWinPercentage,
  combineLeaderStats,
  formatMoney,
  getProfitTextColor,
  getSessionLeader,
  getTotalBuyIns,
  getTotalSessionsPlayed,
} from "@/utils/utils";
import Image from "next/image";
import React from "react";

interface Props {
  sessions: CashSessionWithMember[];
}

async function SessionsOverview({ sessions }: Props) {
  const db = await createClient();
  const sessionsPlayed = getTotalSessionsPlayed(sessions);
  const totalBuyIns = getTotalBuyIns(sessions);
  const avgWin = calculateAverageWin(sessions);
  const avgLoss = calculateAverageLoss(sessions);
  const sessionsLeader = getSessionLeader(sessions);

  const { data: leaderSessions, error: leaderError } = await db
    .from("cashSession")
    .select(`*, member:memberId (firstName, lastName, portraitUrl)`)
    .eq("memberId", sessionsLeader[0]);

  if (leaderError) {
    return <p>Error fetching Session data: {leaderError.message}</p>;
  }

  const leaderData = combineLeaderStats(leaderSessions);

  return (
    <div className="grid my-12 grid-cols-2 w-full md:grid-cols-4 gap-8">
      <div className="border bg-card border-primary rounded p-4">
        <h3 className="mx-auto mb-4 text-center font-semibold text-base md:text-lg">
          Sessions Played
        </h3>
        <p className="text-center text-lg lg:text-2xl mb-4 font-bold">
          {sessionsPlayed}
        </p>
      </div>
      <div className="border bg-card border-primary rounded p-4">
        <h3 className="mx-auto mb-4 text-center font-semibold text-base md:text-lg">
          Total Buy-Ins
        </h3>
        <p className="text-center text-lg lg:text-2xl mb-4 font-bold">
          {formatMoney(totalBuyIns)}
        </p>
      </div>
      <div className="border bg-card max-md:col-span-2 border-primary rounded p-4">
        <h3 className="mx-auto mb-4 text-center font-semibold text-base md:text-lg">
          Avg Winning Session
        </h3>
        <p
          className={
            "text-center text-lg lg:text-2xl mb-4 font-bold text-theme-green"
          }
        >
          {formatMoney(avgWin)}
        </p>
      </div>
      <div className="border bg-card max-md:col-span-2 border-primary rounded p-4">
        <h3 className="mx-auto mb-4 text-center font-semibold text-base md:text-lg">
          Avg Losing Session
        </h3>
        <p
          className={
            "text-center text-lg lg:text-2xl mb-4 font-bold text-theme-red"
          }
        >
          {formatMoney(avgLoss)}
        </p>
      </div>
      <div className="border bg-card col-span-2 md:col-span-4 border-primary rounded p-4">
        <h3 className="mx-auto mb-4 text-center font-semibold text-base md:text-lg">
          Sessions Leader
        </h3>

        <div className="flex items-center justify-between max-md:flex-col gap-8 lg:gap-16">
          <div className="flex gap-8 max-md:items-center max-sm:flex-col">
            <Image
              src={leaderData.member.portraitUrl}
              alt={`${leaderData.member.firstName}_${leaderData.member.lastName}`}
              width={80}
              height={80}
              className="rounded-full w-2/3 sm:w-1/3 lg:w-1/2 aspect-square"
            />
            <h3 className="flex text-2xl lg:text-4xl font-bold md:flex-col gap-2 justify-center">
              <span>{leaderData.member.firstName}</span>
              <span>{leaderData.member.lastName}</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-4 items-center gap-6 flex-grow max-md:w-full">
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Net Profit
              </h4>
              <p className="font-semibold text-lg lg:text-2xl text-theme-green">
                {formatMoney(leaderData.netProfit)}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Gross Profit
              </h4>
              <p className="font-semibold text-lg lg:text-2xl text-theme-green">
                {formatMoney(leaderData.grossProfit)}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Gross Losses
              </h4>
              <p
                className={cn(
                  getProfitTextColor(leaderData.grossLoss),
                  "font-semibold text-lg lg:text-2xl"
                )}
              >
                {formatMoney(leaderData.grossLoss)}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Avg Net Per
              </h4>
              <p
                className={cn(
                  getProfitTextColor(
                    leaderData.netProfit / leaderData.sessionsPlayed
                  ),
                  "font-semibold text-lg lg:text-2xl"
                )}
              >
                {formatMoney(leaderData.netProfit / leaderData.sessionsPlayed)}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Avg Win
              </h4>
              <p
                className={cn(
                  getProfitTextColor(
                    leaderData.grossProfit / leaderData.sessionsPlayed
                  ),
                  "font-semibold text-lg lg:text-2xl"
                )}
              >
                {formatMoney(
                  leaderData.grossProfit / leaderData.sessionsPlayed
                )}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Avg Loss
              </h4>
              <p
                className={cn(
                  getProfitTextColor(
                    leaderData.grossLoss / leaderData.sessionsPlayed
                  ),
                  "font-semibold text-lg lg:text-2xl"
                )}
              >
                {formatMoney(leaderData.grossLoss / leaderData.sessionsPlayed)}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Wins
              </h4>
              <p className={cn("font-semibold text-lg lg:text-2xl")}>
                {leaderData.wins}
              </p>
            </div>
            <div className="flex items-start justify-center flex-col gap-2">
              <h4 className="text-sm lg:text-lg pb-2 border-b border-muted w-full">
                Losses
              </h4>
              <p className={cn("font-semibold text-lg lg:text-2xl")}>
                {leaderData.losses}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionsOverview;
