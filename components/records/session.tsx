import { cn } from "@/lib/utils";
import { RecordsData } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import React from "react";

interface Props {
  data: RecordsData["session"];
  className?: string;
}

function SessionRecords({ data, className }: Props) {
  return (
    <ul
      className={cn(
        "flex w-full flex-col items-start md:grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 justify-start",
        className
      )}>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.biggest_win.portrait_url}
            alt={`career-gross-${data.biggest_win.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Largest Win</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.biggest_win.first_name}{" "}
              {data.biggest_win.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">
              {formatMoney(data.biggest_win.value)}
            </p>
            <p className="text-neutral-400 text-sm">
              (Week {data.biggest_win.week_number}, {data.biggest_win.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.biggest_loss.portrait_url}
            alt={`career-gross-${data.biggest_loss.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Largest Loss</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.biggest_loss.first_name}{" "}
              {data.biggest_loss.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold text-red-600">
              {formatMoney(data.biggest_loss.value)}
            </p>
            <p className="text-neutral-400 text-sm">
              (Week {data.biggest_loss.week_number}, {data.biggest_loss.year})
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
          <h3 className="text-lg font-bold">Most Rebuys</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.rebuys.first_name} {data.rebuys.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">{data.rebuys.value}</p>
            <p className="text-neutral-400 text-sm">
              (Week {data.rebuys.week_number}, {data.rebuys.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.biggest_buy_in.portrait_url}
            alt={`career-gross-${data.biggest_buy_in.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Largest Buy-in</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.biggest_buy_in.first_name}{" "}
              {data.biggest_buy_in.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">{data.biggest_buy_in.value}</p>
            <p className="text-neutral-400 text-sm">
              (Week {data.biggest_buy_in.week_number},{" "}
              {data.biggest_buy_in.year})
            </p>
          </span>
        </span>
      </li>
      <li className="grid w-full grid-cols-[60px_1fr] py-4 border-b border-neutral-400 gap-4">
        <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
          <img
            src={data.biggest_buy_in_plus_win.portrait_url}
            alt={`career-gross-${data.biggest_buy_in_plus_win.first_name}`}
          />
        </figure>
        <span className="flex flex-col gap-1">
          <h3 className="text-lg font-bold">Largest Buy-in + Won Session</h3>
          <span className="flex items-center gap-2">
            <p className="text-neutral-400 font-medium">
              {data.biggest_buy_in_plus_win.first_name}{" "}
              {data.biggest_buy_in_plus_win.last_name.slice(0, 1)}.
            </p>
            <p className="font-semibold">
              {data.biggest_buy_in_plus_win.value}{" "}
              <span className="text-green-500">
                ({formatMoney(data.biggest_buy_in_plus_win.net_profit)})
              </span>
            </p>
            <p className="text-neutral-400 text-sm">
              (Week {data.biggest_buy_in_plus_win.week_number},{" "}
              {data.biggest_buy_in_plus_win.year})
            </p>
          </span>
        </span>
      </li>
    </ul>
  );
}

export default SessionRecords;
