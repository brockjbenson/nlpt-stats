import { CashSessionWeekData, CashSessionWithMember } from "@/utils/types";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  calculatePOYPoints,
  formatMoney,
  getProfitTextColor,
} from "@/utils/utils";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { cn } from "@/lib/utils";
import { Card, CardTitle } from "../ui/card";
import Link from "next/link";

interface Props {
  data: CashSessionWeekData;
  className?: string;
}

function SessionTable({ data, className }: Props) {
  const sessions = data.sessions;
  return (
    <div className="w-full max-w-screen-xl mx-auto mt-4 px-2">
      <Card className="w-full mb-8">
        <CardTitle className="">Session Overview</CardTitle>
        <Table className={cn(className)}>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                Member
              </TableHead>
              <TableHead>Buy-In</TableHead>
              <TableHead>Cash-Out</TableHead>
              <TableHead>Net Profit</TableHead>
              <TableHead>Rebuys</TableHead>
              <TableHead>NLPI Points</TableHead>
              <TableHead>POY Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => {
              return (
                <TableRow key={session.member_id}>
                  <TableCell className="font-bold sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                    <Link
                      scroll={true}
                      className="hover:text-primary underline"
                      href={`/members/${session.member_id}`}>
                      {session.first_name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatMoney(session.buy_in)}</TableCell>
                  <TableCell>{formatMoney(session.cash_out)}</TableCell>
                  <TableCell className={getProfitTextColor(session.net_profit)}>
                    {formatMoney(session.net_profit)}
                  </TableCell>
                  <TableCell>{session.rebuys - 1}</TableCell>
                  <TableCell>{session.nlpi_points.toFixed(3)}</TableCell>
                  <TableCell>{session.poy_points.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default SessionTable;
