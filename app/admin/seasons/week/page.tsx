import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { Medal } from "lucide-react";
import React from "react";

async function Page(props: { searchParams: Promise<{ id: string }> }) {
  const searchParams = await props.searchParams;
  const db = await createClient();

  const { data: week, error: weekError } = await db
    .from("week")
    .select(
      `
      *,
      season:seasonId (year)
      `
    )
    .eq("id", searchParams.id);
  const { data: sessions, error: sessionsError } = await db
    .from("cashSession")
    .select(
      `
      *,
      member:memberId (firstName)
    `
    )
    .eq("weekId", searchParams.id)
    .gt("rebuys", 0)
    .order("netProfit", { ascending: false });

  if (weekError) {
    return <p>Error fetching Week: {weekError.message}</p>;
  }

  if (sessionsError) {
    return (
      <p>
        Error fetching Sessions for week {week[0].weekNumber}:{" "}
        {sessionsError.message}
      </p>
    );
  }

  const getRankIcon = (index: number) => {
    if (index === 0) {
      return <Medal className="text-yellow-500" size={16} />;
    } else if (index === 1) {
      return <Medal className="text-neutral-400" size={16} />;
    } else if (index === 2) {
      return <Medal className="text-orange-700" size={16} />;
    } else {
      return "";
    }
  };

  return (
    <>
      <h2>
        {week[0].season.year} : Week {week[0].weekNumber}
      </h2>
      {sessions.length === 0 ? (
        <p className="text-muted mt-12 text-center mx-auto">
          No sessions recorded for this week
        </p>
      ) : (
        <>
          <div className="grid my-12 grid-cols-1 md:grid-cols-3 gap-8">
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
                      sessions.reduce(
                        (total, session) => total + session.buyIn,
                        0
                      )
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
                {sessions.map((session, index) => {
                  if (index < 3) {
                    return (
                      <li
                        className="flex items-center justify-between w-full pb-2"
                        key={session.id}>
                        <span>{session.member.firstName}</span>
                        <span
                          className={cn(getProfitTextColor(session.netProfit))}>
                          {formatMoney(session.netProfit)}
                        </span>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
            <div className="border bg-card border-primary rounded-md p-4">
              <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
                Biggest Losers
              </h3>
              <ul>
                {sessions.reverse().map((session, index) => {
                  if (index < 3) {
                    return (
                      <li
                        className="flex items-center justify-between w-full pb-2"
                        key={session.id}>
                        <span>{session.member.firstName}</span>
                        <span
                          className={cn(getProfitTextColor(session.netProfit))}>
                          {formatMoney(session.netProfit)}
                        </span>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Buy-In</TableHead>
                <TableHead>Cash-Out</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Rebuys</TableHead>
                <TableHead>NLPI Points</TableHead>
                <TableHead>POY Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.reverse().map((session, index) => (
                <TableRow key={session.id}>
                  <TableCell className="flex items-center gap-4">
                    {session.member.firstName} {getRankIcon(index)}
                  </TableCell>
                  <TableCell>{formatMoney(session.buyIn)}</TableCell>
                  <TableCell>{formatMoney(session.cashOut)}</TableCell>
                  <TableCell className={getProfitTextColor(session.netProfit)}>
                    {formatMoney(session.netProfit)}
                  </TableCell>
                  <TableCell>{session.rebuys}</TableCell>
                  <TableCell>{session.nlpiPoints.toFixed(3)}</TableCell>
                  <TableCell>{session.poyPoints.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}

export default Page;
