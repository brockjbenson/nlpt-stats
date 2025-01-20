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
          const NLPIPoints = calculateNLPIPoints(index, session.netProfit);
          const POYPoints = calculatePOYPoints(index, session.netProfit);
          return (
            <TableRow key={session.id}>
              <TableCell>{session.member.firstName}</TableCell>
              <TableCell>{formatMoney(session.buyIn)}</TableCell>
              <TableCell>{formatMoney(session.cashOut)}</TableCell>
              <TableCell className={getProfitTextColor(session.netProfit)}>
                {formatMoney(session.netProfit)}
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
