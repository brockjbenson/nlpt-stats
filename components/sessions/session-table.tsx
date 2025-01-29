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

interface Props {
  sessions: CashSessionWithMember[];
}

function SessionTable({ sessions }: Props) {
  return (
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
        {sessions.reverse().map((session, index) => {
          const NLPIPoints = calculateNLPIPoints(index, session.net_profit);
          const POYPoints = calculatePOYPoints(index, session.net_profit);
          return (
            <TableRow key={session.id}>
              <TableCell>{session.member.first_name}</TableCell>
              <TableCell>{formatMoney(session.buy_in)}</TableCell>
              <TableCell>{formatMoney(session.cash_out)}</TableCell>
              <TableCell className={getProfitTextColor(session.net_profit)}>
                {formatMoney(session.net_profit)}
              </TableCell>
              <TableCell>{session.rebuys}</TableCell>
              <TableCell>{NLPIPoints.toFixed(3)}</TableCell>
              <TableCell>{POYPoints.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default SessionTable;
