import { cn } from "@/lib/utils";
import { RecordsData } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import React from "react";
import RecordAccordion from "./record";

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
      <li className="w-full">
        <RecordAccordion
          title="Largest Win"
          valueKey="season_biggest_win"
          data={data.biggest_win}
          getTextColor={(v) => getProfitTextColor(v)}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Largest Loss"
          valueKey="season_biggest_loss"
          data={data.biggest_loss}
          getTextColor={(v) => getProfitTextColor(v)}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Rebuys"
          valueKey="season_rebuys"
          data={data.rebuys}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Largest Buy-in"
          valueKey="season_biggest_buy_in"
          data={data.biggest_buy_in}
          getTextColor={(v) => ""}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Largest Buy-in + Win"
          valueKey="season_biggest_buy_in_plus_win"
          data={data.biggest_buy_in_plus_win}
          getTextColor={(v) => getProfitTextColor(v)}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
    </ul>
  );
}

export default SessionRecords;
