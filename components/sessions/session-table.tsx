import { CashSessionWithMember } from "@/utils/types";
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

interface Props {
  sessions: CashSessionWithMember[];
  className?: string;
}

function SessionTable({ sessions, className }: Props) {
  return (
    <div className="w-full max-w-screen-xl mx-auto mt-4 px-2">
      <Card className="w-full mb-8">
        <CardTitle className="">Session Overview</CardTitle>
        <Table className={cn(className)}>
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
            {sessions.map((session, index) => {
              return (
                <TableRow key={session.id}>
                  <TableCell>{session.member.first_name}</TableCell>
                  <TableCell>{formatMoney(session.buy_in)}</TableCell>
                  <TableCell>{formatMoney(session.cash_out)}</TableCell>
                  <TableCell className={getProfitTextColor(session.net_profit)}>
                    {formatMoney(session.net_profit)}
                  </TableCell>
                  <TableCell>{session.rebuys}</TableCell>
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
