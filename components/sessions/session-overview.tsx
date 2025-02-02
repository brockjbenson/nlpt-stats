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
    <div className="grid my-8 grid-cols-1 w-full md:grid-cols-3 gap-8">
      <Card>
        <CardTitle>Session Info</CardTitle>
        <ul>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted">Total Player</span>
            <span className="font-semibold text-xl">{sessions.length}</span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted">Total Buy-Ins</span>
            <span className="font-semibold text-xl">
              {sessions.reduce((total, session) => {
                return total + session.rebuys;
              }, 0)}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span className="text-muted">Money In Play</span>
            <span className="font-semibold text-xl">
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
              src={topEarner.member.portrait_url}
              alt={`${topEarner.member.first_name} ${topEarner.member.last_name}`}
            />
            <h3 className="text-2xl font-semibold">
              {topEarner.member.first_name} {topEarner.member.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(topEarner.net_profit),
                  "font-semibold text-xl"
                )}
              >
                {formatMoney(topEarner.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center w-full">
              <p className="text-muted">Rebuys</p>
              <p className={cn("font-semibold text-xl")}>{topEarner.rebuys}</p>
            </span>
            <span className="flex flex-col gap-1 items-center w-full">
              <p className="text-muted">NLPI Points</p>
              <p className={cn("font-semibold text-xl")}>
                {topEarner.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted">POY Points</p>
              <p className={cn("font-semibold text-xl")}>
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
              src={biggestLoser.member.portrait_url}
              alt={`${biggestLoser.member.first_name} ${biggestLoser.member.last_name}`}
            />
            <h3 className="text-2xl font-semibold">
              {biggestLoser.member.first_name} {biggestLoser.member.last_name}
            </h3>
          </span>
          <div className="grid grid-cols-4 gap-4 w-full">
            <span className="flex flex-col gap-1 items-start w-full">
              <p className="text-muted">Net Profit</p>
              <p
                className={cn(
                  getProfitTextColor(biggestLoser.net_profit),
                  "font-semibold text-xl"
                )}
              >
                {formatMoney(biggestLoser.net_profit)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center w-full">
              <p className="text-muted">Rebuys</p>
              <p className={cn("font-semibold text-xl")}>
                {biggestLoser.rebuys}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-center w-full">
              <p className="text-muted">NLPI Points</p>
              <p className={cn("font-semibold text-xl")}>
                {biggestLoser.nlpi_points.toFixed(3)}
              </p>
            </span>
            <span className="flex flex-col gap-1 items-end w-full">
              <p className="text-muted">POY Points</p>
              <p className={cn("font-semibold text-xl")}>
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
