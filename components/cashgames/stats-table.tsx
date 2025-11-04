"use client";

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
import { SeasonCashStats } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import { FaExpandAlt, FaLongArrowAltDown } from "react-icons/fa";

interface Props {
  seasonStats: SeasonCashStats[];
}

function StatsTable({ seasonStats }: Props) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fullScreenMounted, setFullScreenMounted] = React.useState(false);
  const [sort, setSort] = React.useState({
    column: "net_profit",
    direction: "desc",
  });
  const [sortedSeasonStats, setSortedSeasonStats] = React.useState<
    SeasonCashStats[]
  >([...seasonStats].sort((a, b) => a.first_name.localeCompare(b.first_name)));

  const openFullScreen = () => {
    setIsFullscreen(true);
    setTimeout(() => {
      setFullScreenMounted(true);
    }, 10);
  };

  const closeFullScreen = () => {
    setFullScreenMounted(false);
    setTimeout(() => {
      setIsFullscreen(false);
    }, 300);
  };

  React.useEffect(() => {
    let sortedStats = [...seasonStats];

    sortedStats.sort((a, b) => {
      let aValue: number | string = "";
      let bValue: number | string = "";

      switch (sort.column) {
        case "first_name":
          aValue = a.first_name;
          bValue = b.first_name;
          break;
        case "net_profit":
          aValue = a.net_profit;
          bValue = b.net_profit;
          break;
        case "gross_profit":
          aValue = a.gross_profit || 0;
          bValue = b.gross_profit || 0;
          break;
        case "gross_losses":
          aValue = a.gross_losses || 0;
          bValue = b.gross_losses || 0;
          break;
        case "session_avg":
          aValue = a.session_avg || 0;
          bValue = b.session_avg || 0;
          break;
        case "avg_win":
          aValue = a.avg_win || 0;
          bValue = b.avg_win || 0;
          break;
        case "avg_loss":
          aValue = a.avg_loss || 0;
          bValue = b.avg_loss || 0;
          break;
        case "avg_buy_in":
          aValue = a.avg_buy_in || 0;
          bValue = b.avg_buy_in || 0;
          break;
        case "avg_rebuys":
          aValue = a.avg_rebuys / a.sessions_played || 0;
          bValue = b.avg_rebuys / b.sessions_played || 0;
          break;
        case "sessions_played":
          aValue = a.sessions_played;
          bValue = b.sessions_played;
          break;
        case "wins":
          aValue = a.wins;
          bValue = b.wins;
          break;
        case "losses":
          aValue = a.losses;
          bValue = b.losses;
          break;
        case "win_percentage":
          aValue = a.win_percentage;
          bValue = b.win_percentage;
          break;
        case "win_streak":
          aValue = a.win_streak;
          bValue = b.win_streak;
          break;
        case "loss_streak":
          aValue = a.loss_streak;
          bValue = b.loss_streak;
          break;
        case "current_streak":
          if (a.current_streak.includes("W")) {
            aValue = parseInt(a.current_streak) || 0;
          } else if (a.current_streak.includes("L")) {
            aValue = (parseInt(a.current_streak) || 0) * -1;
          }

          if (b.current_streak.includes("W")) {
            bValue = parseInt(b.current_streak) || 0;
          } else if (b.current_streak.includes("L")) {
            bValue = (parseInt(b.current_streak) || 0) * -1;
          }

          break;
        default:
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        return 0;
      }
    });

    setSortedSeasonStats(sortedStats);
  }, [sort, seasonStats]);

  const handleSort = (column: string, direction: "asc" | "desc") => {
    let newDirection;

    if (sort.column === column) {
      // Same column: toggle
      newDirection = sort.direction === "asc" ? "desc" : "asc";
    } else if (direction) {
      newDirection = direction;
    } else {
      // New column: start with desc
      newDirection = "desc";
    }

    const newSort = { column, direction: newDirection };
    setSort(newSort);
  };

  const renderSortButton = (
    column: string,
    label: string,
    direction: "asc" | "desc" = "desc"
  ) => (
    <button
      className="w-full whitespace-nowrap flex justify-between items-center gap-2"
      onClick={(e) => handleSort(column, direction)}>
      {label}
      <FaLongArrowAltDown
        className={cn(
          sort.column === column ? "opacity-100" : "opacity-0",
          sort.direction === "asc" ? "rotate-0" : "rotate-180"
        )}
      />
    </button>
  );

  return (
    <>
      <div className="px-2">
        <Card className="w-full mb-4">
          <div className="flex pb-6 items-center justify-between">
            <CardTitle className="m-0 p-0">Cash Stats</CardTitle>
            <button
              onClick={openFullScreen}
              className="border-none w-4 h-4 flex items-center justify-center">
              <FaExpandAlt />
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                  {renderSortButton("first_name", "Member")}
                </TableHead>
                <TableHead>
                  {renderSortButton("net_profit", "Net Profit")}
                </TableHead>
                <TableHead>
                  {renderSortButton("gross_profit", "Gross Profit")}
                </TableHead>
                <TableHead>
                  {renderSortButton("gross_losses", "Gross Losses", "asc")}
                </TableHead>
                <TableHead>
                  {renderSortButton("session_avg", "Session Average", "desc")}
                </TableHead>
                <TableHead>
                  {renderSortButton("avg_win", "Average Win")}
                </TableHead>
                <TableHead>
                  {renderSortButton("avg_loss", "Average Loss", "asc")}
                </TableHead>
                <TableHead>
                  {renderSortButton("avg_buy_in", "Average Buy-In")}
                </TableHead>
                <TableHead>
                  {renderSortButton("avg_rebuys", "Average Bullets")}
                </TableHead>
                <TableHead>
                  {renderSortButton("sessions_played", "Sessions")}
                </TableHead>
                <TableHead>{renderSortButton("wins", "Wins")}</TableHead>
                <TableHead>{renderSortButton("losses", "Losses")}</TableHead>
                <TableHead>
                  {renderSortButton("win_percentage", "Win %")}
                </TableHead>
                <TableHead>
                  {renderSortButton("win_streak", "Best W Streak")}
                </TableHead>
                <TableHead>
                  {renderSortButton("loss_streak", "Worst L Streak")}
                </TableHead>
                <TableHead>
                  {renderSortButton("current_streak", "Current Streak")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSeasonStats.map((stats) => {
                return (
                  <TableRow key={stats.member_id}>
                    <TableCell className="font-bold sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                      <Link
                        scroll={true}
                        className="hover:text-primary underline"
                        href={`/members/${stats.member_id}`}>
                        {stats.first_name}
                      </Link>
                    </TableCell>
                    <TableCell
                      className={cn(getProfitTextColor(stats.net_profit))}>
                      {formatMoney(stats.net_profit)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        getProfitTextColor(stats.gross_profit || 0)
                      )}>
                      {formatMoney(stats.gross_profit || 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        getProfitTextColor(stats.gross_losses || 0)
                      )}>
                      {formatMoney(stats.gross_losses || 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        getProfitTextColor(stats.session_avg || 0)
                      )}>
                      {formatMoney(stats.session_avg || 0)}
                    </TableCell>
                    <TableCell
                      className={cn(getProfitTextColor(stats.avg_win || 0))}>
                      {formatMoney(stats.avg_win || 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        getProfitTextColor(stats.avg_loss * -1 || 0)
                      )}>
                      {formatMoney(stats.avg_loss * -1 * -1 || 0)}
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
                        )}>
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
                        )}>
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
      {isFullscreen &&
        createPortal(
          <div
            className={cn(
              "w-full h-screen fixed top-0 left-0 transition-transform duration-300 z-[12034812039481234]",
              fullScreenMounted ? "translate-y-0" : "translate-y-full"
            )}>
            <Card className="w-screen h-screen overflow-y-auto pt-16 border-none rounded-none">
              <div className="flex pb-6 items-center justify-between">
                <CardTitle className="m-0 p-0">Cash Stats</CardTitle>
                <button
                  onClick={closeFullScreen}
                  className="border-none w-6 h-6 flex items-center justify-center">
                  <X />
                </button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                      {renderSortButton("first_name", "Member", "asc")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("net_profit", "Net Profit")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("gross_profit", "Gross Profit")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("gross_losses", "Gross Losses", "asc")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton(
                        "session_avg",
                        "Session Average",
                        "desc"
                      )}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("avg_win", "Average Win")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("avg_loss", "Average Loss", "asc")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("avg_buy_in", "Average Buy-In")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("avg_rebuys", "Average Bullets")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("sessions_played", "Sessions")}
                    </TableHead>
                    <TableHead>{renderSortButton("wins", "Wins")}</TableHead>
                    <TableHead>
                      {renderSortButton("losses", "Losses")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("win_percentage", "Win %")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("win_streak", "Best W Streak")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("loss_streak", "Worst L Streak")}
                    </TableHead>
                    <TableHead>
                      {renderSortButton("current_streak", "Current Streak")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSeasonStats.map((stats) => {
                    return (
                      <TableRow key={stats.member_id}>
                        <TableCell className="font-bold sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                          <Link
                            scroll={true}
                            className="hover:text-primary underline"
                            href={`/members/${stats.member_id}`}>
                            {stats.first_name}
                          </Link>
                        </TableCell>
                        <TableCell
                          className={cn(getProfitTextColor(stats.net_profit))}>
                          {formatMoney(stats.net_profit)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getProfitTextColor(stats.gross_profit || 0)
                          )}>
                          {formatMoney(stats.gross_profit || 0)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getProfitTextColor(stats.gross_losses || 0)
                          )}>
                          {formatMoney(stats.gross_losses || 0)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getProfitTextColor(stats.session_avg || 0)
                          )}>
                          {formatMoney(stats.session_avg || 0)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getProfitTextColor(stats.avg_win || 0)
                          )}>
                          {formatMoney(stats.avg_win || 0)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getProfitTextColor(stats.avg_loss * -1 || 0)
                          )}>
                          {formatMoney(stats.avg_loss * -1 * -1 || 0)}
                        </TableCell>
                        <TableCell>
                          {formatMoney(stats.avg_buy_in || 0)}
                        </TableCell>
                        <TableCell>
                          {(stats.avg_rebuys / stats.sessions_played).toFixed(
                            2
                          )}
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
                            )}>
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
                            )}>
                            {stats.current_streak}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>,
          document.body
        )}
    </>
  );
}

export default StatsTable;
