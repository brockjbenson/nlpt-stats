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
import { CashSessionWithFullMember } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { Medal } from "lucide-react";
import Link from "next/link";
import React from "react";

async function Page(props: { searchParams: Promise<{ id: string }> }) {
  const searchParams = await props.searchParams;
  const db = await createClient();

  const { data: week, error: weekError } = await db
    .from("week")
    .select(
      `
      *,
      season:season_id (year)
      `
    )
    .eq("id", searchParams.id);
  const { data: sessions, error: sessionsError } = await db
    .from("cash_session")
    .select(
      `
      *,
      member:member_id(*)
    `
    )
    .eq("week_id", searchParams.id)
    .gt("rebuys", 0)
    .order("net_profit", { ascending: false });

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
        {week[0].season.year} : Week {week[0].week_number}{" "}
        <Link href={`/admin/seasons/week/edit?id=${week[0].id}`}>Edit</Link>
      </h2>
      {sessions.length === 0 ? (
        <p className="text-muted mt-12 text-center mx-auto">
          No sessions recorded for this week
        </p>
      ) : (
        <>
          <div className="grid my-12 grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border bg-card border-primary rounded p-4">
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
                    {sessions.reduce(
                      (total, session: CashSessionWithFullMember) => {
                        return total + session.rebuys;
                      },
                      0
                    )}
                  </span>
                </li>
                <li className="flex items-center justify-between w-full pb-2">
                  <span>Money In Play</span>
                  <span>
                    {formatMoney(
                      sessions.reduce(
                        (total, session: CashSessionWithFullMember) =>
                          total + session.buy_in,
                        0
                      )
                    )}
                  </span>
                </li>
              </ul>
            </div>
            <div className="border bg-card border-primary rounded p-4">
              <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
                Top Earners
              </h3>
              <ul className="w-full">
                {sessions.map((session: CashSessionWithFullMember, index) => {
                  if (index < 3) {
                    return (
                      <li
                        className="flex items-center justify-between w-full pb-2"
                        key={session.id}>
                        <span>{session.member.first_name}</span>
                        <span
                          className={cn(
                            getProfitTextColor(session.net_profit)
                          )}>
                          {formatMoney(session.net_profit)}
                        </span>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
            <div className="border bg-card border-primary rounded p-4">
              <h3 className="mx-auto mb-8 text-center font-semibold text-base md:text-lg">
                Biggest Losers
              </h3>
              <ul>
                {sessions
                  .reverse()
                  .map((session: CashSessionWithFullMember, index) => {
                    if (index < 3) {
                      return (
                        <li
                          className="flex items-center justify-between w-full pb-2"
                          key={session.id}>
                          <span>{session.member.first_name}</span>
                          <span
                            className={cn(
                              getProfitTextColor(session.net_profit)
                            )}>
                            {formatMoney(session.net_profit)}
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
              {sessions
                .reverse()
                .map((session: CashSessionWithFullMember, index) => (
                  <TableRow key={session.id}>
                    <TableCell className="flex items-center gap-4">
                      {session.member.first_name} {getRankIcon(index)}
                    </TableCell>
                    <TableCell>{formatMoney(session.buy_in)}</TableCell>
                    <TableCell>{formatMoney(session.cash_out)}</TableCell>
                    <TableCell
                      className={getProfitTextColor(session.net_profit)}>
                      {formatMoney(session.net_profit)}
                    </TableCell>
                    <TableCell>{session.rebuys}</TableCell>
                    <TableCell>{session.nlpi_points.toFixed(3)}</TableCell>
                    <TableCell>{session.poy_points.toFixed(2)}</TableCell>
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
