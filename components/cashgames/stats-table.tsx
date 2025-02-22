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
import { CumulativeCashStats, SeasonCashStats } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import Link from "next/link";
import React from "react";

interface Props {
  seasonStats: SeasonCashStats[];
}

function StatsTable({ seasonStats }: Props) {
  console.log(seasonStats);

  return (
    <div className="px-2">
      <Card className="w-full mb-4">
        <CardTitle>Cash Stats</CardTitle>
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
              <TableHead>
                <span className="w-full flex flex-col gap-1 items-center justify-center">
                  <span>Current</span>
                  <span>Streak</span>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasonStats.map((stats) => {
              return (
                <TableRow key={stats.member_id}>
                  <TableCell className="font-bold">
                    <Link
                      className="hover:text-primary underline"
                      href={`/members/${stats.member_id}`}
                    >
                      {stats.first_name}
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.net_profit))}
                  >
                    {formatMoney(stats.net_profit)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.gross_profit || 0))}
                  >
                    {formatMoney(stats.gross_profit || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.gross_losses || 0))}
                  >
                    {formatMoney(stats.gross_losses || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.session_avg || 0))}
                  >
                    {formatMoney(stats.session_avg || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.avg_win || 0))}
                  >
                    {formatMoney(stats.avg_win || 0)}
                  </TableCell>
                  <TableCell
                    className={cn(getProfitTextColor(stats.avg_loss || 0))}
                  >
                    {formatMoney(stats.avg_loss || 0)}
                  </TableCell>
                  <TableCell>{formatMoney(stats.avg_buy_in || 0)}</TableCell>
                  <TableCell>
                    {(stats.avg_rebuys / stats.sessions_played).toFixed(2)}
                  </TableCell>
                  <TableCell>{stats.sessions_played}</TableCell>
                  <TableCell>{stats.wins}</TableCell>
                  <TableCell>{stats.losses}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        stats.win_percentage < 50
                          ? "text-theme-red"
                          : "text-theme-green"
                      )}
                    >
                      {stats.win_percentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{stats.win_streak}</TableCell>
                  <TableCell>{stats.loss_streak}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        stats.current_streak.includes("W")
                          ? "text-theme-green"
                          : "text-theme-red"
                      )}
                    >
                      {stats.current_streak}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default StatsTable;
