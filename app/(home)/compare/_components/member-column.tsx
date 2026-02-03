import { CareerData } from "@/utils/types";
import React from "react";
import Image from "next/image";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";

function CompareMemberColumn({
  memberStats,
  columnIndex,
}: {
  memberStats: CareerData | null;
  columnIndex: number;
}) {
  return (
    <div>
      {memberStats && (
        <>
          <div className="mt-4">
            <div className="w-full h-full mx-auto aspect-square rounded-full relative overflow-hidden flex items-center justify-center">
              <Image
                className="w-full h-full object-cover absolute"
                src={memberStats.portrait_url}
                alt={`${memberStats.first_name} ${memberStats.last_name}`}
                width={96}
                height={96}
              />
            </div>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center gap-2 mt-8",
              columnIndex === 0 ? "items-end pr-8" : "items-start pl-8",
            )}>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.cash_stats.sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.tournament_stats.sessions}
            </p>
            <p
              className={cn(
                "w-fit flex font-semibold items-center text-sm h-6",
                getProfitTextColor(memberStats.career_stats.total_net_profit),
              )}>
              {formatMoney(memberStats.career_stats.total_net_profit)}
            </p>
            <p
              className={cn(
                "w-fit flex font-semibold items-center text-sm h-6",
                getProfitTextColor(memberStats.career_stats.total_gross_profit),
              )}>
              {formatMoney(memberStats.career_stats.total_gross_profit)}
            </p>
            <p
              className={cn(
                "w-fit flex font-semibold items-center text-sm h-6",
                getProfitTextColor(memberStats.career_stats.total_gross_losses),
              )}>
              {formatMoney(memberStats.career_stats.total_gross_losses)}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
            <p className="w-fit flex font-semibold items-center text-sm h-6">
              {memberStats.career_stats.total_sessions}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareMemberColumn;
