import { cn } from "@/lib/utils";
import { RecordsData } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import React from "react";

interface Props {
  data: RecordsData["season"];
  className?: string;
}

function SeasonRecords({ data, className }: Props) {
  return (
    <ul
      className={cn(
        "flex w-full flex-col items-start md:grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 justify-start",
        className
      )}>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.gross_profit.portrait_url}
            alt={`career-gross-${data.gross_profit.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Gross Profit</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.gross_profit.first_name}{" "}
              {data.gross_profit.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">
              {formatMoney(data.gross_profit.value)}
            </p>
            <p className="text-neutral-400 text-sm">
              ({data.gross_profit.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.net_profit.portrait_url}
            alt={`career-gross-${data.net_profit.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Net Profit</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.net_profit.first_name}{" "}
              {data.net_profit.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">
              {formatMoney(data.net_profit.value)}
            </p>
            <p className="text-neutral-400 text-sm">({data.net_profit.year})</p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.win_percentage.portrait_url}
            alt={`career-gross-${data.win_percentage.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Win Percentage</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.win_percentage.first_name}{" "}
              {data.win_percentage.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">
              {formatMoney(data.win_percentage.value * 100)}%
            </p>
            <p className="text-neutral-400 text-sm">
              ({data.win_percentage.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.total_wins.portrait_url}
            alt={`career-gross-${data.total_wins.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Total Wins</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.total_wins.first_name}{" "}
              {data.total_wins.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">{data.total_wins.value}</p>
            <p className="text-neutral-400 text-sm">({data.total_wins.year})</p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.cash_wins.portrait_url}
            alt={`career-gross-${data.cash_wins.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Cash Wins</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.cash_wins.first_name} {data.cash_wins.last_name.slice(0, 1)}
              .
            </p>
            <p className="font-semibold">{data.cash_wins.value}</p>
            <p className="text-neutral-400 text-sm">({data.cash_wins.year})</p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.tournament_wins.portrait_url}
            alt={`career-gross-${data.tournament_wins.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Tournament Wins</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.tournament_wins.first_name}{" "}
              {data.tournament_wins.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">{data.tournament_wins.value}</p>
            <p className="text-neutral-400 text-sm">
              ({data.tournament_wins.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.rebuys.portrait_url}
            alt={`career-gross-${data.rebuys.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Total Buy-Ins</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.rebuys.first_name} {data.rebuys.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">{data.rebuys.value}</p>
            <p className="text-neutral-400 text-sm">({data.rebuys.year})</p>
          </span>
        </span>
      </li>
    </ul>
  );
}

export default SeasonRecords;
