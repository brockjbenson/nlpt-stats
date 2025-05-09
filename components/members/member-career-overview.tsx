"use client";

import { cn } from "@/lib/utils";
import {
  CareerData,
  NLPIData,
  NLPIHistoricalRecord,
  POYData,
} from "@/utils/types";
import {
  formatMoney,
  getOrdinalSuffix,
  getProfitTextColor,
} from "@/utils/utils";
import React from "react";

interface Props {
  nlpiData: NLPIData[];
  poyData: POYData[];
  careerStats: CareerData;
  currentYear: number;
  view: string | undefined;
  nlpiHistoricalRecords: NLPIHistoricalRecord[];
}

function MemberOverview({
  nlpiData,
  poyData,
  careerStats,
  currentYear,
  view,
  nlpiHistoricalRecords,
}: Props) {
  if (view === "overview" || view === undefined)
    return (
      <div className="px-4 grid grid-cols-2 gap-4 py-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            POY Rank ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {poyData.length > 0 ? getOrdinalSuffix(poyData[0].rank) : "N/A"}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">NLPI Rank</h2>
          <p className="text-lg font-bold text-white">
            {nlpiData[0].total_points > 0
              ? getOrdinalSuffix(nlpiData[0].rank)
              : "N/A"}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Best NLPI Rank</h2>
          <p className="text-lg font-bold text-white">
            {getOrdinalSuffix(nlpiHistoricalRecords[0].best_rank)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Total Weeks at #1
          </h2>
          <p className="text-lg font-bold text-white">
            {nlpiHistoricalRecords[0].total_weeks_at_1
              ? nlpiHistoricalRecords[0].total_weeks_at_1
              : 0}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Career Wins</h2>
          <p className="text-lg font-bold text-white">
            {careerStats.career_stats.total_wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Wins ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {careerStats.cash_stats.season_stats.filter(
              (s) => s.season_year === currentYear
            )[0]?.wins ?? 0}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Win Percentage</h2>
          <p className="text-lg font-bold text-white">
            {(
              (careerStats.career_stats.total_wins /
                careerStats.career_stats.total_sessions) *
              100
            ).toFixed(2)}
            %
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Net Profit</h2>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(careerStats.career_stats.total_net_profit)
            )}>
            {formatMoney(careerStats.career_stats.total_net_profit)}
          </p>
        </div>
      </div>
    );

  if (view === "cash")
    return (
      <div className="px-4 grid grid-cols-2 gap-4 py-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Career Net Profit
          </h2>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(careerStats.cash_stats.net_profit)
            )}>
            {formatMoney(careerStats.cash_stats.net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Net Profit ({currentYear})
          </h2>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(
                careerStats.cash_stats.season_stats.filter(
                  (s) => s.season_year === currentYear
                )[0]?.net_profit ?? 0
              )
            )}>
            {formatMoney(
              careerStats.cash_stats.season_stats.filter(
                (s) => s.season_year === currentYear
              )[0]?.net_profit ?? 0
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Career Wins</h2>
          <p className="text-lg font-bold text-white">
            {careerStats.cash_stats.wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Wins ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {careerStats.cash_stats.season_stats.filter(
              (s) => s.season_year === currentYear
            )[0]?.wins ?? 0}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Career Win %</h2>
          <p className="text-lg font-bold text-white">
            {(
              (careerStats.cash_stats.wins / careerStats.cash_stats.sessions) *
              100
            ).toFixed(2)}
            %
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Win % ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {careerStats.cash_stats.season_stats.filter(
              (s) => s.season_year === currentYear
            )[0]?.wins
              ? (
                  (careerStats.cash_stats.season_stats.filter(
                    (s) => s.season_year === currentYear
                  )[0]?.wins /
                    careerStats.cash_stats.season_stats.filter(
                      (s) => s.season_year === currentYear
                    )[0].sessions) *
                  100
                ).toFixed(2)
              : 0}
            %
          </p>
        </div>
      </div>
    );

  if (view === "majors")
    return (
      <div className="px-4 grid grid-cols-2 gap-4 py-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Career Net Profit
          </h2>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(careerStats.tournament_stats.net_profit)
            )}>
            {formatMoney(careerStats.tournament_stats.net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Net Profit ({currentYear})
          </h2>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(
                careerStats.tournament_stats.season_stats.filter(
                  (s) => s.season_year === currentYear
                )[0]
                  ? careerStats.tournament_stats.season_stats.filter(
                      (s) => s.season_year === currentYear
                    )[0].net_profit
                  : 0
              )
            )}>
            {formatMoney(
              careerStats.tournament_stats.season_stats.filter(
                (s) => s.season_year === currentYear
              )[0]
                ? careerStats.tournament_stats.season_stats.filter(
                    (s) => s.season_year === currentYear
                  )[0].net_profit
                : 0
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Career Wins</h2>
          <p className="text-lg font-bold text-white">
            {careerStats.tournament_stats.wins}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Wins ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {careerStats.tournament_stats.season_stats.filter(
              (s) => s.season_year === currentYear
            )[0]
              ? careerStats.tournament_stats.season_stats.filter(
                  (s) => s.season_year === currentYear
                )[0].wins
              : 0}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">Career Top 3's</h2>
          <p className="text-lg font-bold text-white">
            {careerStats.tournament_stats.top_three}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h2 className="text-muted text-base font-normal">
            Top 3's ({currentYear})
          </h2>
          <p className="text-lg font-bold text-white">
            {careerStats.tournament_stats.season_stats.filter(
              (s) => s.season_year === currentYear
            )[0]
              ? careerStats.tournament_stats.season_stats.filter(
                  (s) => s.season_year === currentYear
                )[0].top_three
              : 0}
          </p>
        </div>
      </div>
    );
}

export default MemberOverview;
