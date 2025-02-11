import { Card, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CumulativeCashStats } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import Link from "next/link";
import React from "react";

interface Props {
  cumulativeCashStats: CumulativeCashStats[];
}

function StatsTable({ cumulativeCashStats }: Props) {
  return (
    <Card className="w-full mb-8">
      <CardTitle className="pt-2 pb-4 pl-2">Cash Stats</CardTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Net</span>
                <span>Profit</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Gross</span>
                <span>Profit</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Gross</span>
                <span>Losses</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Session</span>
                <span>Average</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Average</span>
                <span>Win</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Average</span>
                <span>Loss</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Average</span>
                <span>Buy-In</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Average</span>
                <span>Bullets</span>
              </span>
            </TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead>Losses</TableHead>
            <TableHead>Win %</TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Best W</span>
                <span>Streak</span>
              </span>
            </TableHead>
            <TableHead>
              <span className="w-full flex flex-col gap-1 items-center justify-center">
                <span>Worst L</span>
                <span>Streak</span>
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cumulativeCashStats
            .filter((stats) => stats.sessionsPlayed > 0)
            .map((stats) => {
              return (
                <TableRow key={stats.member.id}>
                  <TableCell className="font-bold">
                    <Link
                      className="hover:text-primary underline"
                      href={`/members/${stats.member.id}`}>
                      {stats.member.first_name}
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.netProfit))}>
                    {formatMoney(stats.netProfit)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.grossProfit))}>
                    {formatMoney(stats.grossProfit)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.grossLoss))}>
                    {formatMoney(stats.grossLoss)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      getProfitTextColor(stats.netProfit / stats.sessionsPlayed)
                    )}>
                    {formatMoney(stats.netProfit / stats.sessionsPlayed || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.averageWin))}>
                    {formatMoney(stats.averageWin)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.averageLoss))}>
                    {formatMoney(stats.averageLoss)}
                  </TableCell>
                  <TableCell>{formatMoney(stats.averageBuyIn || 0)}</TableCell>
                  <TableCell>
                    {(stats.totalRebuys / stats.sessionsPlayed || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>{stats.sessionsPlayed}</TableCell>
                  <TableCell>{stats.wins}</TableCell>
                  <TableCell>{stats.losses}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        stats.winPercentage < 50
                          ? "text-red-500"
                          : "text-green-500"
                      )}>
                      {stats.winPercentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{stats.winStreak}</TableCell>
                  <TableCell>{stats.losingStreak}</TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default StatsTable;
