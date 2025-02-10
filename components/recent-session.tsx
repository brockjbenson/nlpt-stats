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
}

function RecentSession({ sessions, year }: Props) {
  const playedSessions = sessions.filter((session) => session.buy_in > 0);
  const weekNumber = playedSessions[0].week.week_number;

  const rankedSessions = playedSessions.sort(
    (a, b) => b.net_profit - a.net_profit
  );

  return (
    <div className=" w-full max-w-screen-xl">
      <h3 className="mb-4 font-semibold text-lg">
        Week {weekNumber}, {year ? year : null}
      </h3>
      <SessionTable sessions={rankedSessions} />
    </div>
  );
}

export default RecentSession;
