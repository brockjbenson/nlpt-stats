"use client";
import { cn } from "@/lib/utils";
import { CareerData, Season } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { ChevronDown } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectTrigger } from "../ui/select";

interface Props {
  careerStats: CareerData;
  view: string | undefined;
  seasons: Season[];
}

function MemberCashStats({ careerStats, view, seasons }: Props) {
  const [year, setActiveYear] = React.useState<string | undefined>(undefined);
  const [dropDownOpen, setDropDownOpen] = React.useState(false);
  const currentDropDownLabel = year ? `${year}` : "Career";
  const availableSeasons = seasons.filter((s) =>
    careerStats.cash_stats.season_stats.find((ss) => ss.season_year === s.year)
  );
  const cashStats =
    year === undefined
      ? careerStats.cash_stats
      : careerStats.cash_stats.season_stats.filter(
          (s) => s.season_year === parseInt(year)
        )[0];

  const careerCashStats = careerStats.cash_stats;

  const avgWin =
    cashStats.gross_profit > 0 && cashStats.wins > 0
      ? cashStats.gross_profit / cashStats.wins
      : 0;
  const avgLoss =
    cashStats.gross_losses < 0 && cashStats.losses > 0
      ? cashStats.gross_losses / cashStats.losses
      : 0;
  const winLossRatio = avgWin > 0 && avgLoss < 0 ? (avgWin / avgLoss) * -1 : 0;

  const minWinPercentage = (1 / (1 + winLossRatio)) * 100;

  return (
    <div className="w-full md:gap-8 md:col-span-2 grid grid-cols-1 md:grid-cols-2 mt-4 px-4 ">
      <div className="flex w-full md:col-span-2 py-4 justify-between border-t-[2px] border-neutral-700 items-center">
        <h3 className="text-xl font-semibold">
          {year === undefined ? "Career Cash Stats" : `${year} Cash Stats`}
        </h3>
        <Select open={dropDownOpen} onOpenChange={setDropDownOpen}>
          <SelectTrigger className="border w-[112px] border-neutral-700 rounded-full py-2 px-3 bg-transparent h-fit flex items-center gap-1 text-base font-normal">
            {currentDropDownLabel}
            <ChevronDown
              className={cn(
                "w-6 h-6 ml-2 transition-transform duration-150",
                dropDownOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <div className="flex w-full flex-col">
              <span
                className="w-full py-2 pl-2 pr-4"
                onClick={() => {
                  setActiveYear(undefined);
                  setDropDownOpen(false);
                }}>
                Career
              </span>
              {availableSeasons.map((season) => (
                <span
                  onClick={() => {
                    setActiveYear(season.year.toString());
                    setDropDownOpen(false);
                  }}
                  key={season.id + season.year}
                  className="w-full py-2 pl-2 pr-4">
                  {season.year}
                </span>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 w-full max-w-[800px] mx-auto md:grid-cols-4 pb-4 gap-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Sessions</h3>
          <p className="text-lg font-bold text-white">{cashStats.sessions}</p>
        </div>
        <div className="flex flex-col gap-2 items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Wins</h3>
          <p className="text-lg font-bold text-white">{cashStats.wins}</p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Losses</h3>
          <p className="text-lg font-bold text-white">{cashStats.losses}</p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Net Profit</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(cashStats.net_profit)
            )}>
            {formatMoney(cashStats.net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Gross Profit</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(cashStats.gross_profit)
            )}>
            {formatMoney(cashStats.gross_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Gross Losses</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(cashStats.gross_losses)
            )}>
            {formatMoney(cashStats.gross_losses)}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Net</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(cashStats.net_profit / cashStats.sessions)
            )}>
            {formatMoney(cashStats.net_profit / cashStats.sessions)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Win</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(cashStats.gross_profit / cashStats.wins)
            )}>
            {formatMoney(cashStats.gross_profit / cashStats.wins)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Loss</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(
                cashStats.losses && cashStats.losses !== 0
                  ? cashStats.gross_losses / cashStats.losses
                  : 0
              )
            )}>
            {formatMoney(
              cashStats.losses && cashStats.losses !== 0
                ? cashStats.gross_losses / cashStats.losses
                : 0
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Buy-In</h3>
          <p className="text-lg font-bold text-white">
            {formatMoney(
              cashStats.total_buy_ins
                ? cashStats.total_buy_ins / cashStats.sessions
                : 0
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Rebuys</h3>
          <p className="text-lg font-bold text-white">
            {(cashStats.total_rebuys
              ? cashStats.total_rebuys / cashStats.sessions - 1
              : 0
            ).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Win %</h3>
          <p className="text-lg font-bold text-white">
            {((cashStats.wins / cashStats.sessions) * 100).toFixed(2)}%
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Total Buy-In's</h3>
          <p className="text-lg font-bold text-white">
            {formatMoney(cashStats.total_buy_ins || 0)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Total Rebuys</h3>
          <p className="text-lg font-bold text-white">
            {cashStats.total_rebuys - cashStats.sessions || 0}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Min Win %</h3>
          <p className="text-lg font-bold text-white">
            {minWinPercentage.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="max-md:py-4 max-md:border-t-[2px] max-md:border-neutral-700">
        <h3 className="text-xl block md:hidden font-semibold">
          Advanced Stats
        </h3>
        <div className="grid grid-cols-2 gap-4 max-md:py-4">
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">ROI</h2>
            <p className={cn("text-lg font-bold text-white")}>
              {(
                (careerCashStats.net_profit / careerCashStats.total_buy_ins) *
                100
              ).toFixed(2)}
              %
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">
              Best Month (Single)
            </h2>
            <p
              className={cn(
                "text-lg font-bold text-white",
                getProfitTextColor(careerCashStats.best_month.net_profit)
              )}>
              {formatMoney(careerCashStats.best_month.net_profit)}
              <span className="text-xs ml-2 text-muted font-normal">
                {new Date(careerCashStats.best_month.month).toLocaleString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">
              Best Month (Overall)
            </h2>
            <p
              className={cn(
                "text-lg font-bold text-white",
                getProfitTextColor(
                  careerCashStats.most_profitable_month.net_profit
                )
              )}>
              {formatMoney(careerCashStats.most_profitable_month.net_profit)}
              <span className="text-xs ml-2 text-muted font-normal">
                {careerCashStats.most_profitable_month.month}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">Best Session</h2>
            <p
              className={cn(
                "text-lg font-bold text-white",
                getProfitTextColor(careerCashStats.largest_win.net_profit)
              )}>
              {formatMoney(careerCashStats.largest_win.net_profit)}
              <span className="text-xs ml-2 text-muted font-normal">
                (W{careerCashStats.largest_win.week_number},{" "}
                {careerCashStats.largest_win.season_year})
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">Longest W Streak</h2>
            <p className={cn("text-lg font-bold text-white")}>
              {careerCashStats.longest_win_streak}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start justify-start">
            <h2 className="text-muted text-sm font-normal">Longest L Streak</h2>
            <p className={cn("text-lg font-bold text-white")}>
              {careerCashStats.longest_loss_streak}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberCashStats;
