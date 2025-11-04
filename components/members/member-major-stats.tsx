import { CareerData, Season } from "@/utils/types";
import React from "react";
import { Select, SelectContent, SelectTrigger } from "../ui/select";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";

interface Props {
  careerStats: CareerData;
  view: string | undefined;
  seasons: Season[];
}

function MemberMajorStats({ careerStats, view, seasons }: Props) {
  const [year, setActiveYear] = React.useState<string | undefined>(undefined);

  const [dropDownOpen, setDropDownOpen] = React.useState(false);
  const currentDropDownLabel = year ? `${year}` : "Career";
  const availableSeasons = seasons.filter((s) =>
    careerStats.tournament_stats.season_stats.find(
      (ss) => ss.season_year === s.year
    )
  );
  const majorStats =
    year === undefined
      ? careerStats.tournament_stats
      : careerStats.tournament_stats.season_stats.filter(
          (s) => s.season_year === parseInt(year)
        )[0];
  return (
    <div className="w-full mt-4 px-4 md:col-span-2">
      <div className="flex w-full py-4  justify-between border-t-[2px] border-neutral-700 items-center">
        <h3 className="text-xl font-semibold">
          {year === undefined ? "Career Major Stats" : `${year} Major Stats`}
        </h3>
        <Select open={dropDownOpen} onOpenChange={setDropDownOpen}>
          <SelectTrigger className="border w-[112px] border-neutral-700 py-2 px-3 bg-transparent h-fit flex items-center gap-1 text-base font-normal">
            {currentDropDownLabel}
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
      <div className="grid grid-cols-3 md:grid-cols-5 pb-4 gap-4">
        <div className="flex flex-col gap-2 items-start justify-start">
          <h3 className="text-muted text-sm font-normal">Sessions</h3>
          <p className="text-lg font-bold text-white">{majorStats.sessions}</p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:mr-16 md:mr-10 justify-center">
          <h3 className="text-muted text-sm font-normal">Wins</h3>
          <p className="text-lg font-bold text-white">{majorStats.wins}</p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center justify-end">
          <h3 className="text-muted text-sm font-normal">Top 3's</h3>
          <p className="text-lg font-bold text-white">{majorStats.top_three}</p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center lg:ml-16 md:ml-10 justify-start">
          <h3 className="text-muted text-sm font-normal">In The Money</h3>
          <p className="text-lg font-bold text-white">
            {majorStats.in_the_money}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-end justify-center">
          <h3 className="text-muted text-sm font-normal">Best Finish</h3>
          <p className="text-lg font-bold text-white">
            {majorStats.best_finish}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-start justify-end">
          <h3 className="text-muted text-sm font-normal">Top 3 %</h3>
          <p className="text-lg font-bold text-white">
            {((majorStats.top_three / majorStats.sessions) * 100).toFixed(2)}%
          </p>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-center lg:mr-16 md:mr-10 justify-start">
          <h3 className="text-muted text-sm font-normal">Net Profit</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(majorStats.net_profit)
            )}>
            {formatMoney(majorStats.net_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center">
          <h3 className="text-muted text-sm font-normal">Gross Profit</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(majorStats.gross_profit)
            )}>
            {formatMoney(majorStats.gross_profit)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center lg:ml-16 md:ml-10 justify-end">
          <h3 className="text-muted text-sm font-normal">Gross Losses</h3>
          <p
            className={cn(
              "text-lg font-bold text-white",
              getProfitTextColor(majorStats.gross_losses)
            )}>
            {formatMoney(majorStats.gross_losses)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-end justify-start">
          <h3 className="text-muted text-sm font-normal">Avg Buy In</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {formatMoney(majorStats.total_buy_ins / majorStats.sessions)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-start justify-center">
          <h3 className="text-muted text-sm font-normal">Avg Rebuys</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {(majorStats.total_rebuys / majorStats.sessions).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end md:items-center lg:mr-16 md:mr-10 justify-end">
          <h3 className="text-muted text-sm font-normal">Avg Place</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {majorStats.avg_finish.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-center justify-start">
          <h3 className="text-muted text-sm font-normal">Total Buy In's</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {formatMoney(majorStats.total_buy_ins)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center lg:ml-16 md:ml-10 justify-center">
          <h3 className="text-muted text-sm font-normal">Total Rebuys</h3>
          <p className={cn("text-lg font-bold text-white")}>
            {majorStats.total_rebuys}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <h3 className="text-muted underline flex items-center gap-1 text-sm font-normal">
                Efficiency
                <Info className="w-4 h-4 text-muted" />
              </h3>
            </SheetTrigger>
            <SheetContent className="h-[50%] rounded-t-[20px]" side="bottom">
              <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                Efficiency Score
              </SheetTitle>
              <p className="text-sm">
                Efficiency score is used to determine how consistent you are in
                Majors out of <strong>90.00</strong>. When reading efficiency
                score, the higher the score, the better.
              </p>
              <p className="text-sm mt-4 font-semibold">Formula:</p>
              <p className="font-bold w-full text-center mt-4 mx-auto text-lg">
                Score = 100 − (Avg Place × 10)
              </p>
            </SheetContent>
          </Sheet>
          <p className={cn("text-lg font-bold text-white")}>
            {(100 - majorStats.avg_finish * 10).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MemberMajorStats;
