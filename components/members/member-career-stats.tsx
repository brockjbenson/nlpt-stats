import { CareerData, Season } from "@/utils/types";
import React from "react";
import { cn } from "@/lib/utils";
import { formatMoney, getProfitTextColor } from "@/utils/utils";

interface Props {
  stats: CareerData;
  view: string | undefined;
  seasons: Season[];
}

function MemberCareerStats({ stats }: Props) {
  return (
    <div className="w-full mt-4 max-lg:px-4 md:col-span-2">
      <div className="flex w-full py-4  justify-between border-t-[2px] border-neutral-700 items-center">
        <h3 className="text-xl font-semibold">Career Stats</h3>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 pb-4 gap-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Total Sessions</h3>
          <p className="text-lg font-bold text-white">
            {stats.career_stats.total_sessions}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:mr-10 md:mr-3 justify-start">
          <h3 className="text-muted text-sm font-normal">Cash Sessions</h3>
          <p className="text-lg font-bold text-white">
            {stats.cash_stats.sessions}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Major Sessions</h3>
          <p className="text-lg font-bold text-white">
            {stats.tournament_stats.sessions}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center justify-center">
          <h3 className="text-muted text-sm font-normal">Total Wins</h3>
          <p className="text-lg font-bold text-white">
            {stats.career_stats.total_wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:ml-10 md:ml-3 justify-end">
          <h3 className="text-muted text-sm font-normal">Cash Wins</h3>
          <p className="text-lg font-bold text-white">
            {stats.cash_stats.wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Major Wins</h3>
          <p className="text-lg font-bold text-white">
            {stats.tournament_stats.wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-center">
          <h3 className="text-muted text-sm font-normal">Career Net</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.career_stats.total_net_profit)
            )}>
            {formatMoney(stats.career_stats.total_net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:mr-10 md:mr-3 justify-end">
          <h3 className="text-muted text-sm font-normal">Cash Net</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.cash_stats.net_profit)
            )}>
            {formatMoney(stats.cash_stats.net_profit)}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Major Net</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.tournament_stats.net_profit)
            )}>
            {formatMoney(stats.tournament_stats.net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center justify-center">
          <h3 className="text-muted text-sm font-normal">Career Gross</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.career_stats.total_gross_profit)
            )}>
            {formatMoney(stats.career_stats.total_gross_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:ml-10 md:ml-3 justify-end">
          <h3 className="text-muted text-sm font-normal">Cash Gross</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.cash_stats.gross_profit)
            )}>
            {formatMoney(stats.cash_stats.gross_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Major Gross</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(stats.tournament_stats.gross_profit)
            )}>
            {formatMoney(stats.tournament_stats.gross_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-center">
          <h3 className="text-muted text-sm font-normal">Major Top 3's</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {stats.tournament_stats.top_three}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:mr-10 md:mr-3 justify-end">
          <h3 className="text-muted text-sm font-normal">Avg Major Place</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {stats.tournament_stats.avg_finish.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Major Top 3 %</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {stats.tournament_stats.sessions > 0 &&
              (
                (stats.tournament_stats.top_three /
                  stats.tournament_stats.sessions) *
                100
              ).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center justify-center">
          <h3 className="text-muted text-sm font-normal">Career Win %</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {(
              (stats.career_stats.total_wins /
                stats.career_stats.total_sessions) *
              100
            ).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:ml-10 md:ml-3 justify-center">
          <h3 className="text-muted text-sm font-normal">Cash Win %</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {(
              (stats.cash_stats.wins / stats.cash_stats.sessions) *
              100
            ).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-center">
          <h3 className="text-muted text-sm font-normal">Major Win %</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {(
              (stats.tournament_stats.wins / stats.tournament_stats.sessions) *
              100
            ).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MemberCareerStats;
