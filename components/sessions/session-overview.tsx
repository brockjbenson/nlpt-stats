import { cn } from "@/lib/utils";
import { CashSession, CashSessionWithMember, Member } from "@/utils/types";
import {
  formatMoney,
  getBottomThree,
  getProfitTextColor,
  getTopThree,
} from "@/utils/utils";
import React, { memo } from "react";
import { Card, CardTitle } from "../ui/card";
import MemberImage from "../members/member-image";

interface ExtendedCashSession extends CashSession {
  member: Member;
}

interface Props {
  sessions: ExtendedCashSession[];
}

function SessionOverview({ sessions }: Props) {
  const topEarner = [...sessions].sort(
    (a, b) => b.nlpi_points - a.nlpi_points
  )[0];
  const biggestLoser = [...sessions].sort(
    (a, b) => a.nlpi_points - b.nlpi_points
  )[0];
  return (
    <div className="grid mt-4 mb-4 grid-cols-1 w-full max-w-screen-xl px-2 mx-auto md:grid-cols-3 gap-4">
      <Card>
        <CardTitle className="pt-2 pl-2">Session Info</CardTitle>
        <ul>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-sm">
              Total Player
            </span>
            <span className="font-semibold text-lg md:text-xl">
              {sessions.length}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-sm">
              Total Buy-Ins
            </span>
            <span className="font-semibold text-lg md:text-xl">
              {sessions.reduce((total, session) => {
                return total + session.rebuys;
              }, 0)}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted md:text-base text-sm">
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
        <CardTitle className="pt-2 pl-2">Top Earner</CardTitle>
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-4">
            <MemberImage
              zoom="1.5"
              className="w-10 h-10 object-bottom rounded-full"
              src={topEarner.member.portrait_url}
              alt={`${topEarner.member.first_name} ${topEarner.member.last_name}`}
            />
            <h3 className="text-lg md:text-2xl font-semibold">
              {topEarner.member.first_name} {topEarner.member.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted md:text-base text-sm">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(topEarner.net_profit),
                  "font-semibold text-lg md:text-xl"
                )}>
                {formatMoney(topEarner.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-sm">Rebuys</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.rebuys}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-sm">NLPI Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted md:text-base text-sm">POY Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {topEarner.poy_points.toFixed(2)}
              </p>
            </span>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle className="pt-2 pl-2">Biggest Loser</CardTitle>
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-4">
            <MemberImage
              zoom="1.5"
              className="w-10 h-10 object-bottom rounded-full"
              src={biggestLoser.member.portrait_url}
              alt={`${biggestLoser.member.first_name} ${biggestLoser.member.last_name}`}
            />
            <h3 className="text-lg md:text-2xl font-semibold">
              {biggestLoser.member.first_name} {biggestLoser.member.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted md:text-base text-sm">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(biggestLoser.net_profit),
                  "font-semibold text-lg md:text-xl"
                )}>
                {formatMoney(biggestLoser.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-sm">Rebuys</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {biggestLoser.rebuys}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center justify-end w-full">
              <p className="text-muted md:text-base text-sm">NLPI Points</p>
              <p className={cn("font-semibold text-lg md:text-xl")}>
                {biggestLoser.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted md:text-base text-sm">POY Points</p>
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
