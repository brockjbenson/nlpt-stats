"use client";

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import React from "react";
import StatCard from "./card";
import { Member } from "@/utils/types";
import { cn } from "@/lib/utils";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import Link from "next/link";
import { StatsData, StatsLeaders } from "../../_lib/types";
import { getStatsLeaders } from "../../_lib/utils/getStatsLeaders";

interface StatCardsProps {
  data: StatsData[];
  members: Member[];
}
function StatCards({ data, members }: StatCardsProps) {
  const leaders: StatsLeaders = getStatsLeaders(data);

  return (
    <div>
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <StatCard
              title="Net Profit"
              members={members}
              data={leaders.netProfit}
              renderValue={(item) => (
                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    getProfitTextColor(item.net_profit),
                  )}>
                  {formatMoney(item.net_profit)}
                </p>
              )}
              renderDrawerColumns={() => (
                <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                  <span className="text-muted">Name</span>
                  <span className="text-muted text-end">Net</span>
                </div>
              )}
              renderDrawerRows={(item) => (
                <div
                  className="w-full grid grid-cols-2 py-3 border-b border-neutral-600"
                  key={`${item.member_id}-net`}>
                  <h3 className="text-base font-semibold md:text-xl">
                    <Link href={`/members/${item.member_id}`}>
                      {item.first_name}
                    </Link>
                  </h3>
                  <p
                    className={cn(
                      "font-semibold text-base md:text-lg text-end",
                      getProfitTextColor(item.net_profit),
                    )}>
                    {formatMoney(item.net_profit)}
                  </p>
                </div>
              )}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              title="Win Percentage"
              members={members}
              data={leaders.winPercentage}
              renderValue={(item) => (
                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    item.win_percentage >= 50
                      ? "text-green-500"
                      : "text-red-500",
                  )}>
                  {item.win_percentage.toFixed(2)}%
                </p>
              )}
              renderDrawerColumns={() => (
                <div className="grid border-b border-neutral-600 pb-2 grid-cols-3">
                  <span className="text-muted">Name</span>
                  <span className="text-muted">Sessions</span>
                  <span className="text-muted text-end">Value</span>
                </div>
              )}
              renderDrawerRows={(item) => (
                <div
                  className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                  key={`${item.member_id}-winpct`}>
                  <h3 className="text-base font-semibold md:text-xl">
                    <Link href={`/members/${item.member_id}`}>
                      {item.first_name}
                    </Link>
                  </h3>
                  <p className="font-semibold text-base md:text-lg">
                    {item.sessions_played}
                  </p>
                  <p
                    className={cn(
                      "font-semibold text-end text-base md:text-lg",
                      item.win_percentage >= 50
                        ? "text-green-500"
                        : "text-red-500",
                    )}>
                    {item.win_percentage.toFixed(2)}%
                  </p>
                </div>
              )}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              title="Gross Profit"
              members={members}
              data={leaders.grossProfit}
              renderValue={(item) => (
                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    getProfitTextColor(item.gross_profit),
                  )}>
                  {formatMoney(item.gross_profit)}
                </p>
              )}
              renderDrawerColumns={() => (
                <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                  <span className="text-muted">Name</span>
                  <span className="text-muted text-end">Gross</span>
                </div>
              )}
              renderDrawerRows={(item) => (
                <div
                  className="w-full flex justify-between items-center py-3 border-b border-neutral-600"
                  key={`${item.member_id}-gross`}>
                  <h3 className="text-base font-semibold md:text-xl">
                    <Link href={`/members/${item.member_id}`}>
                      {item.first_name}
                    </Link>
                  </h3>
                  <p
                    className={cn(
                      "font-semibold text-base md:text-lg",
                      getProfitTextColor(item.gross_profit),
                    )}>
                    {formatMoney(item.gross_profit)}
                  </p>
                </div>
              )}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              title="Session Average"
              members={members}
              data={leaders.sessionAvg}
              renderValue={(item) => (
                <p
                  className={cn(
                    "font-semibold text-lg md:text-xl",
                    getProfitTextColor(item.session_avg),
                  )}>
                  {formatMoney(item.session_avg)}
                </p>
              )}
              renderDrawerColumns={() => (
                <div className="grid border-b border-neutral-600 pb-2 grid-cols-3">
                  <span className="text-muted">Name</span>
                  <span className="text-muted">Rebuys Per</span>
                  <span className="text-muted text-end">Avg Net</span>
                </div>
              )}
              renderDrawerRows={(item) => (
                <div
                  className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                  key={`${item.member_id}-avg`}>
                  <h3 className="text-base font-semibold md:text-xl">
                    <Link href={`/members/${item.member_id}`}>
                      {item.first_name}
                    </Link>
                  </h3>
                  <p className="font-semibold text-base md:text-lg">
                    {(item.avg_rebuys / item.sessions_played).toFixed(2)}
                  </p>
                  <p
                    className={cn(
                      "font-semibold text-base md:text-lg text-end",
                      getProfitTextColor(item.session_avg),
                    )}>
                    {formatMoney(item.session_avg)}
                  </p>
                </div>
              )}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              title="Sessions Played"
              members={members}
              data={leaders.sessionsPlayed}
              renderValue={(item) => (
                <p className={cn("font-semibold text-lg md:text-xl")}>
                  {item.sessions_played}
                </p>
              )}
              renderDrawerColumns={() => (
                <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                  <span className="text-muted">Name</span>
                  <span className="text-muted text-end">Sessions Played</span>
                </div>
              )}
              renderDrawerRows={(item) => (
                <div
                  className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                  key={`${item.member_id}-avg`}>
                  <h3 className="text-base font-semibold md:text-xl">
                    <Link href={`/members/${item.member_id}`}>
                      {item.first_name}
                    </Link>
                  </h3>
                  <p className="font-semibold text-base md:text-lg">
                    {item.sessions_played}
                  </p>
                </div>
              )}
            />
          </CarouselItem>
        </CarouselContent>
        <div className="flex items-center mt-4 justify-center gap-8">
          <CarouselPrevious />
          <CarouselDots />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
}

export default StatCards;
