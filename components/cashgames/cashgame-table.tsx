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
import { Card, CardTitle } from "../ui/card";
import { Minus } from "lucide-react";

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
  const [{ data: weeks, error: weeksError }] = await Promise.all([
    db.from("week").select("id, week_number").eq("season_id", seasonId),
  ]);

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
      return (
        <TableCell key={weekId}>
          <Minus className="text-muted" size={16} />
        </TableCell>
      );
    }

    const { id, net_profit, rebuys } = sessionData;
    return (
      <TableCell className={cn("font-medium text-center group")} key={weekId}>
        <span className="flex items-center gap-1">
          <span className={cn("text-muted", getProfitTextColor(net_profit))}>
            {rebuys === 0 ? "DNP" : formatMoney(net_profit)}
          </span>
        </span>
      </TableCell>
    );
  };

  return (
    <div className="px-2 w-full max-w-screen-xl mx-auto">
      <Card className="w-full overflow-hidden">
        <CardTitle>Cash Sessions</CardTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                Member
              </TableHead>
              {weeks.map((week) => (
                <TableHead className="whitespace-nowrap" key={week.id}>
                  <Link
                    scroll={true}
                    className="underline"
                    href={
                      isAdmin
                        ? `/admin/stats/cash/${seasonId}/sessions/${week.id}/edit`
                        : `/stats/cash/${year}/${week.week_number}`
                    }>
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
                    <TableCell className="font-semibold sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                      <Link
                        scroll={true}
                        className="hover:text-primary underline"
                        href={`/members/${member.id}`}>
                        {member.first_name}
                      </Link>
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
    </div>
  );
}

export default CashGameTable;
