import { cn } from "@/lib/utils";
import { CashSession, CashSessionWithMember } from "@/utils/types";
import {
  formatMoney,
  getBottomThree,
  getProfitTextColor,
  getTopThree,
} from "@/utils/utils";
import React from "react";

interface Props {
  sessions: CashSessionWithMember[];
}

function SessionOverview({ sessions }: Props) {
  const topEarners = getTopThree(sessions);
  const biggestLosers = getBottomThree(sessions);
  return (
    <div className="grid my-12 grid-cols-1 w-full md:grid-cols-3 gap-8">
      <div className="border bg-card border-primary rounded-md p-4">
        <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
          Session Info
        </h3>
        <ul>
          <li className="flex items-center justify-between w-full pb-2">
            <span>Total Player</span>
            <span>{sessions.length}</span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span>Total Buy-Ins</span>
            <span>
              {sessions.reduce((total, session) => {
                return total + session.rebuys;
              }, 0)}
            </span>
          </li>
          <li className="flex items-center justify-between w-full pb-2">
            <span>Money In Play</span>
            <span>
              {formatMoney(
                sessions.reduce((total, session) => total + session.buyIn, 0)
              )}
            </span>
          </li>
        </ul>
      </div>
      <div className="border bg-card border-primary rounded-md p-4">
        <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
          Top Earners
        </h3>
        <ul className="w-full">
          {topEarners.map((session) => (
            <li
              className="flex items-center justify-between w-full pb-2"
              key={session.id}>
              <span>{session.member.firstName}</span>
              <span className={cn(getProfitTextColor(session.netProfit))}>
                {formatMoney(session.netProfit)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border bg-card border-primary rounded-md p-4">
        <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
          Biggest Losers
        </h3>
        <ul>
          {biggestLosers.map((session) => (
            <li
              className="flex items-center justify-between w-full pb-2"
              key={session.id}>
              <span>{session.member.firstName}</span>
              <span className={cn(getProfitTextColor(session.netProfit))}>
                {formatMoney(session.netProfit)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SessionOverview;
