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

interface Props {
  members: Member[];
  seasonId: string;
}

async function CashGameTable({ members, seasonId }: Props) {
  const db = await createClient();

  // Fetch weeks for the season
  const { data: weeks, error: weeksError } = await db
    .from("week")
    .select("*")
    .eq("seasonId", seasonId);

  if (weeksError) {
    return <p>Error fetching Weeks: {weeksError.message}</p>;
  }

  // Fetch all cash sessions for the season
  const { data: sessions, error: sessionsError } = await db
    .from("cashSession")
    .select("*")
    .in(
      "weekId",
      weeks.map((week) => week.id) // Only include weeks for this season
    );

  if (sessionsError) {
    return <p>Error fetching Sessions: {sessionsError.message}</p>;
  }

  // Create a lookup map for quick access
  const sessionLookup: Record<string, CashSession[]> = {};
  sessions?.forEach((session) => {
    const key = `${session.memberId}-${session.weekId}`;
    if (!sessionLookup[key]) {
      sessionLookup[key] = [];
    }
    sessionLookup[key].push(session);
  });

  // Helper function to get session data from the lookup map
  const getSessionData = (memberId: string, weekId: string) => {
    const key = `${memberId}-${weekId}`;
    return sessionLookup[key] || [];
  };

  return (
    <div className="mt-12">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap sticky bg-card left-0 z-10 text-foreground">
              Member
            </TableHead>
            {weeks.map((week) => (
              <TableHead
                className="whitespace-nowrap text-foreground"
                key={week.id}>
                <Link href={`/admin/seasons/week?id=${week.id}`}>
                  Week {week.weekNumber}
                </Link>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="sticky font-semibold bg-card left-0 z-10">
                {member.firstName}
              </TableCell>
              {weeks.map((week) => {
                const sessionData = getSessionData(member.id, week.id);
                return (
                  <TableCell
                    className={cn(
                      getProfitTextColor(
                        sessionData.length && sessionData[0].netProfit
                      ),
                      "font-medium text-center"
                    )}
                    key={week.id}>
                    {sessionData.length > 0
                      ? sessionData[0].rebuys === 0
                        ? "DNP"
                        : formatMoney(sessionData[0].netProfit)
                      : "-"}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default CashGameTable;
