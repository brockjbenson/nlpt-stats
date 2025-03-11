import { cn } from "@/lib/utils";
import { CashSessionWeekData } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import React, { memo } from "react";
import { Card, CardTitle } from "../ui/card";
import MemberImage from "../members/member-image";

interface Props {
  data: CashSessionWeekData;
}

function SessionOverview({ data }: Props) {
  const sessions = data.sessions;
  const topEarner = sessions[0];
  const biggestLoser = sessions[sessions.length - 1];
  const sessionDate = new Date(data.date);
  return (
    <div className="grid mt-4 mb-4 grid-cols-1 w-full max-w-screen-xl px-2 mx-auto md:grid-cols-3 gap-4">
      <Card>
        <div className="flex pb-6 items-center justify-between">
          <CardTitle className="p-0">Session Info</CardTitle>
          <p className="text-muted text-xs md:text-sm">
            {sessionDate.toLocaleDateString()}
          </p>
        </div>
        <ul>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-xs">
              Total Players
            </span>
            <span className="font-semibold text-lg md:text-xl">
              {sessions.length}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-xs">
              Total Buy-Ins
            </span>
            <span className="font-semibold text-lg md:text-xl">
              {sessions.reduce((total, session) => {
                return total + session.rebuys;
              }, 0)}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-xs">
              Money In Play
            </span>
            <span className="font-semibold text-lg md:text-xl">
              {formatMoney(
                sessions.reduce((total, session) => total + session.buy_in, 0)
              )}
            </span>
          </li>
        </ul>
      </Card>
      <Card>
        <CardTitle>Top Earner</CardTitle>
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-4">
            <MemberImage
              zoom="1.5"
              className="w-10 h-10 object-bottom rounded-full"
              src={topEarner.portrait_url}
              alt={`${topEarner.first_name} ${topEarner.last_name}`}
            />
            <h3 className="text-lg md:text-2xl font-semibold">
              {topEarner.first_name} {topEarner.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted md:text-base text-xs">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(topEarner.net_profit),
                  "font-semibold text-lg md:text-xl"
                )}>
                {formatMoney(topEarner.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-xs">Rebuys</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.rebuys - 1}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-xs">NLPI Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted md:text-base text-xs">POY Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.poy_points.toFixed(2)}
              </p>
            </span>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>Biggest Loser</CardTitle>
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-4">
            <MemberImage
              zoom="1.5"
              className="w-10 h-10 object-bottom rounded-full"
              src={biggestLoser.portrait_url}
              alt={`${biggestLoser.first_name} ${biggestLoser.last_name}`}
            />
            <h3 className="text-lg md:text-2xl font-semibold">
              {biggestLoser.first_name} {biggestLoser.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted md:text-base text-xs">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(biggestLoser.net_profit),
                  "font-semibold text-lg md:text-xl"
                )}>
                {formatMoney(biggestLoser.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-xs">Rebuys</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {biggestLoser.rebuys - 1}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-xs">NLPI Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {biggestLoser.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted md:text-base text-xs">POY Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {biggestLoser.poy_points.toFixed(2)}
              </p>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SessionOverview;
