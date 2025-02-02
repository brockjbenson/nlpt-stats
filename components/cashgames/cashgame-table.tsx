import { CashSession, Member } from "@/utils/types";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/lib/utils";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import Link from "next/link";
import { Card } from "../ui/card";

interface Props {
  members: Member[];
  seasonId: string;
  isAdmin?: boolean;
  year: number;
}

async function CashGameTable({
  members,
  seasonId,
  year,
  isAdmin = false,
}: Props) {
  const db = await createClient();

  // Fetch weeks for the season
  const { data: weeks, error: weeksError } = await db
    .from("week")
    .select("id, week_number")
    .eq("season_id", seasonId);

  if (weeksError) {
    return <p>Error fetching Weeks: {weeksError.message}</p>;
  }

  if (!weeks?.length) {
    return <p>No weeks found for this season.</p>;
  }

  // Fetch all cash sessions for the season
  const { data: sessions, error: sessionsError } = await db
    .from("cash_session")
    .select("id, member_id, week_id, net_profit, rebuys")
    .in(
      "week_id",
      weeks.map((week) => week.id)
    );

  if (sessionsError) {
    return <p>Error fetching Sessions: {sessionsError.message}</p>;
  }

  // Precompute session lookup map
  const sessionLookup = sessions?.reduce<Record<string, CashSession>>(
    (acc, session) => {
      const key = `${session.member_id}-${session.week_id}`;
      acc[key] = session as any;
      return acc;
    },
    {}
  );

  // Helper functions
  const getSessionData = (memberId: string, weekId: string) => {
    return sessionLookup?.[`${memberId}-${weekId}`] || null;
  };

  const hasAtLeastOneSession = (memberId: string) => {
    return sessions?.some(
      (session) => session.member_id === memberId && session.rebuys > 0
    );
  };

  const renderTableCell = (sessionData: CashSession | null, weekId: string) => {
    if (!sessionData) {
      return <TableCell key={weekId}>-</TableCell>;
    }

    const { id, net_profit, rebuys } = sessionData;
    return (
      <TableCell className={cn("font-medium text-center group")} key={weekId}>
        <span className="flex items-center gap-1">
          <span className={cn(getProfitTextColor(net_profit))}>
            {rebuys === 0 ? "DNP" : formatMoney(net_profit)}
          </span>
        </span>
      </TableCell>
    );
  };

  return (
    <Card className="w-full overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap sticky left-0 z-10">
              Member
            </TableHead>
            {weeks.map((week) => (
              <TableHead className="whitespace-nowrap" key={week.id}>
                <Link
                  href={
                    isAdmin
                      ? `/admin/stats/cash/${seasonId}/sessions/${week.id}/edit`
                      : `/stats/${year}/cash/sessions/${week.week_number}`
                  }
                >
                  Week {week.week_number}
                </Link>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(
            (member) =>
              hasAtLeastOneSession(member.id) && (
                <TableRow key={member.id}>
                  <TableCell className="sticky font-semibold left-0 z-10">
                    {member.first_name}
                  </TableCell>
                  {weeks.map((week) => {
                    const sessionData = getSessionData(member.id, week.id);
                    return renderTableCell(sessionData, week.id);
                  })}
                </TableRow>
              )
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export default CashGameTable;
