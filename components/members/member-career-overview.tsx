import { cn } from "@/lib/utils";
import { CareerData, NLPIData, POYData } from "@/utils/types";
import {
  formatMoney,
  getOrdinalSuffix,
  getProfitTextColor,
} from "@/utils/utils";
import React from "react";

interface Props {
  nlpiData: NLPIData[];
  poyData: POYData[];
  careerData: CareerData[];
}

function MemberCareerOverview({ nlpiData, poyData, careerData }: Props) {
  const careerStats = careerData[0];
  return (
    <div className="px-2 grid grid-cols-3 gap-4 py-4">
      <div className="flex flex-col gap-2 items-start justify-start">
        <h2 className="text-muted text-base font-normal">POY Rank</h2>
        <p className="text-xl font-bold text-white">
          {getOrdinalSuffix(poyData[0].rank)}
        </p>
      </div>
      <div className="flex flex-col gap-2 items-center justify-center">
        <h2 className="text-muted text-base font-normal">NLPI Rank</h2>
        <p className="text-xl font-bold text-white">
          {getOrdinalSuffix(nlpiData[0].rank)}
        </p>
      </div>
      <div className="flex flex-col gap-2 items-end justify-end">
        <h2 className="text-muted text-base font-normal">Wins</h2>
        <p className="text-xl font-bold text-white">{careerStats.total_wins}</p>
      </div>
      <div className="flex flex-col gap-2 items-start justify-start">
        <h2 className="text-muted text-base font-normal">Net Profit</h2>
        <p
          className={cn(
            "text-xl font-bold text-white",
            getProfitTextColor(careerStats.total_net_profit)
          )}>
          {formatMoney(careerStats.total_net_profit)}
        </p>
      </div>
      <div className="flex flex-col gap-2 items-center justify-center">
        <h2 className="text-muted text-base font-normal">Gross Profit</h2>
        <p
          className={cn(
            "text-xl font-bold text-white",
            getProfitTextColor(careerStats.total_gross_profit)
          )}>
          {formatMoney(careerStats.total_gross_profit)}
        </p>
      </div>
      <div className="flex flex-col gap-2 items-end justify-end">
        <h2 className="text-muted text-base font-normal">Gross Losses</h2>
        <p
          className={cn(
            "text-xl font-bold text-white",
            getProfitTextColor(careerStats.total_gross_losses)
          )}>
          {formatMoney(careerStats.total_gross_losses)}
        </p>
      </div>
    </div>
  );
}

export default MemberCareerOverview;
