"use client";

import {
  CareerData,
  Member,
  NLPIData,
  NLPIHistoricalRecord,
  POYData,
  Season,
} from "@/utils/types";
import React from "react";
import MemberAllStats from "./member-all-stats";
import MemberOverview from "./member-career-overview";
import MemberHeader from "./member-header";
import MemberViewCarousel from "./member-view-carousel";
import { MemberRadarChart } from "./member-radar-chart";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Info } from "lucide-react";

type avgData = {
  avg_rebuys: number;
  session_avg: number;
  avg_roi: number;
  avg_buy_in: number;
  win_percentage: number;
};

type AdvancedSkills = {
  bounce_back_rate: number;
  avg_net_profit_after_loss: number;
  rebuy_rate: number;
  avg_rebuys_after_loss: number;
  largest_bounce_back: number;
  rebuy_avg_net_profit: number;
  rebuy_win_percentage: number;
  rebuy_largest_net_profit: number;
  no_rebuy_win_percentage: number;
  no_rebuy_avg_net_profit: number;
  no_rebuy_largest_net_profit: number;
};

interface Props {
  id: string;
  member: Member;
  currentYear: number;
  nlpiData: NLPIData[];
  poyData: POYData[];
  careerStats: CareerData;
  seasons: Season[];
  joinDate: string;
  nlpiHistoricalRecords: NLPIHistoricalRecord[];
  avgData: avgData;
  advancedSkills: AdvancedSkills;
}

function MemberMain({
  id,
  member,
  currentYear,
  nlpiData,
  poyData,
  careerStats,
  seasons,
  joinDate,
  nlpiHistoricalRecords,
  avgData,
  advancedSkills,
}: Props) {
  const [view, setView] = React.useState<string>("overview");

  return (
    <>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <MemberHeader member={member} joinDate={joinDate} />
        <div>
          <MemberViewCarousel setView={setView} view={view} />
          <MemberOverview
            nlpiHistoricalRecords={nlpiHistoricalRecords}
            view={view}
            currentYear={currentYear}
            nlpiData={nlpiData}
            poyData={poyData}
            careerStats={careerStats}
          />
          {view === "skills" && (
            <>
              <MemberRadarChart
                data={{
                  avg_rebuys: {
                    nlpt: avgData.avg_rebuys,
                    member:
                      careerStats.cash_stats.total_rebuys /
                      careerStats.cash_stats.sessions,
                  },
                  session_avg: {
                    nlpt: avgData.session_avg,
                    member:
                      careerStats.cash_stats.gross_profit /
                      careerStats.cash_stats.wins,
                  },
                  avg_roi: {
                    nlpt: avgData.avg_roi,
                    member:
                      (careerStats.cash_stats.net_profit /
                        careerStats.cash_stats.total_buy_ins) *
                      100,
                  },
                  avg_buy_in: {
                    nlpt: avgData.avg_buy_in, // This should be dynamic if available
                    member:
                      careerStats.cash_stats.total_buy_ins /
                      careerStats.cash_stats.sessions,
                  },
                  avg_win_percentage: {
                    nlpt: avgData.win_percentage, // Assuming NLPT average is 100% for win percentage
                    member:
                      (careerStats.cash_stats.wins /
                        careerStats.cash_stats.sessions) *
                      100,
                  },
                }}
              />
              <div className="px-3 border-t border-neutral-500 py-4">
                <h2>Bounce Back</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    <span className="flex items-center gap-1">
                      Bounce Back Rate
                      <Popover>
                        <PopoverTrigger>
                          <Info className="cursor-pointer w-4 h-4 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent className="p-2">
                          <p className="text-sm">
                            This stat measures how often you follow up a losing
                            session up with a winning session
                          </p>
                        </PopoverContent>
                      </Popover>
                    </span>
                    <span className="font-semibold text-lg text-foreground">
                      {advancedSkills.bounce_back_rate.toFixed(2)}%
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Avg Bounce Back Session
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(
                          advancedSkills.avg_net_profit_after_loss
                        )
                      )}>
                      {formatMoney(advancedSkills.avg_net_profit_after_loss)}
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Best Bounce Back Session
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(advancedSkills.largest_bounce_back)
                      )}>
                      {formatMoney(advancedSkills.largest_bounce_back)}
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Avg Rebuys Following Loss
                    <span
                      className={cn("font-semibold text-foreground text-lg")}>
                      {advancedSkills.avg_rebuys_after_loss}
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Rebuy Rate Following Loss
                    <span
                      className={cn("font-semibold text-foreground text-lg")}>
                      {advancedSkills.rebuy_rate.toFixed(2)}%
                    </span>
                  </li>
                </ul>
              </div>
              <div className="px-3 border-t border-neutral-500 py-4">
                <h2>Volume Shooter</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Win Rate after Rebuy
                    <span className="font-semibold text-lg text-foreground">
                      {advancedSkills.rebuy_win_percentage.toFixed(2)}%
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Avg Rebuy Session Net
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(advancedSkills.rebuy_avg_net_profit)
                      )}>
                      {formatMoney(advancedSkills.rebuy_avg_net_profit)}
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Largest Rebuy Session
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(
                          advancedSkills.rebuy_largest_net_profit
                        )
                      )}>
                      {formatMoney(advancedSkills.rebuy_largest_net_profit)}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="px-3 border-t border-neutral-500 py-4">
                <h2>Conservative Tendencies</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Win Rate w/o Rebuy
                    <span className="font-semibold text-lg text-foreground">
                      {advancedSkills.no_rebuy_win_percentage.toFixed(2)}%
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Avg Session w/o Rebuy
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(
                          advancedSkills.no_rebuy_avg_net_profit
                        )
                      )}>
                      {formatMoney(advancedSkills.no_rebuy_avg_net_profit)}
                    </span>
                  </li>
                  <li className="flex items-center text-muted-foreground justify-between text-base">
                    Largest Session w/o Rebuy
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        getProfitTextColor(
                          advancedSkills.no_rebuy_largest_net_profit
                        )
                      )}>
                      {formatMoney(advancedSkills.no_rebuy_largest_net_profit)}
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
        <MemberAllStats
          seasons={seasons}
          view={view}
          careerStats={careerStats}
        />
      </div>
    </>
  );
}

export default MemberMain;
