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
import { Pencil } from "lucide-react";

interface Props {
  members: Member[];
  seasonId: string;
}

async function CashGameTable({ members, seasonId }: Props) {
  const db = await createClient();

  // Fetch weeks for the season
  const { data: weeks, error: weeksError } = await db
    .from("week")
    .select("id, weekNumber")
    .eq("seasonId", seasonId);

  if (weeksError) {
    return <p>Error fetching Weeks: {weeksError.message}</p>;
  }

  if (!weeks?.length) {
    return <p>No weeks found for this season.</p>;
  }

  // Fetch all cash sessions for the season
  const { data: sessions, error: sessionsError } = await db
    .from("cashSession")
    .select("id, memberId, weekId, netProfit, rebuys")
    .in(
      "weekId",
      weeks.map((week) => week.id)
    );

  if (sessionsError) {
    return <p>Error fetching Sessions: {sessionsError.message}</p>;
  }

  // Precompute session lookup map
  const sessionLookup = sessions?.reduce<Record<string, CashSession>>(
    (acc, session) => {
      const key = `${session.memberId}-${session.weekId}`;
      acc[key] = session;
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
      (session) => session.memberId === memberId && session.rebuys > 0
    );
  };

  const renderTableCell = (sessionData: CashSession | null, weekId: string) => {
    if (!sessionData) {
      return <TableCell key={weekId}>-</TableCell>;
    }

    const { id, netProfit, rebuys } = sessionData;
    return (
      <TableCell className={cn("font-medium text-center group")} key={weekId}>
        <span className="flex items-center gap-1">
          <span className={cn(getProfitTextColor(netProfit))}>
            {rebuys === 0 ? "DNP" : formatMoney(netProfit)}
          </span>
          <Link
            className="hover:text-primary"
            href={`/admin/stats/cashgames/edit?id=${id}`}>
            <Pencil className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100" />
          </Link>
        </span>
      </TableCell>
    );
  };

  return (
    <div className="mt-12 w-full max-w-screen-xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap sticky left-0 z-10">
              Member
            </TableHead>
            {weeks.map((week) => (
              <TableHead className="whitespace-nowrap" key={week.id}>
                <Link href={`/admin/seasons/week?id=${week.id}`}>
                  Week {week.weekNumber}
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
                    {member.firstName}
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
    </div>
  );
}

export default CashGameTable;
