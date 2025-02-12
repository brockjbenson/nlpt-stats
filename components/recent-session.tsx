import { CashSession, Member, Week } from "@/utils/types";
import React from "react";
import { Card, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  getProfitTextColor,
  getRankTextColor,
} from "@/utils/utils";
import SessionTable from "./sessions/session-table";

interface ExtendedCashSession extends CashSession {
  member: Member;
  week: Week;
}

interface Props {
  sessions: ExtendedCashSession[]; // Making sessions an array
  year?: number;
  className?: string;
}

function RecentSession({ sessions, year, className }: Props) {
  const playedSessions = sessions.filter((session) => session.buy_in > 0);
  const weekNumber = playedSessions[0].week.week_number;

  const rankedSessions = playedSessions.sort(
    (a, b) => b.net_profit - a.net_profit
  );

  return (
    <div className={cn("w-full mx-auto max-w-screen-xl", className)}>
      <div className="flex items-center mt-4 justify-between px-2 w-full">
        <h1 className="text-xl font-bold md:text-2xl">Recent Session</h1>
        <p className="text-sm md:text-base text-muted font-semibold">
          Week {weekNumber}, {year}
        </p>
      </div>
      <SessionTable sessions={rankedSessions} />
    </div>
  );
}

export default RecentSession;
