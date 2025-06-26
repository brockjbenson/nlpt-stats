import { cn } from "@/lib/utils";
import { RecordsData } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import React from "react";
import RecordAccordion from "./record";

interface Props {
  data: RecordsData["season"];
  className?: string;
}

function SeasonRecords({ data, className }: Props) {
  console.log(data);

  return (
    <ul
      className={cn(
        "flex w-full flex-col items-start md:grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 justify-start",
        className
      )}>
      <li className="w-full">
        <RecordAccordion
          title="Gross Profit"
          valueKey="career_gross_profit"
          data={data.gross_profit}
          getTextColor={(v) => getProfitTextColor(v)}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Net Profit"
          valueKey="career_net_profit"
          data={data.net_profit}
          getTextColor={(v) => getProfitTextColor(v)}
          formatValue={(v) => formatMoney(v)}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Win Percentage"
          valueKey="career_win_percentage"
          data={data.win_percentage}
          getTextColor={(v) => ""}
          formatValue={(v) => (v * 100).toFixed(2) + "%"}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Total Wins"
          valueKey="career_total_wins"
          data={data.total_wins}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Cash Wins"
          valueKey="career_cash_wins"
          data={data.cash_wins}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Tournament Wins"
          valueKey="career_tournament_wins"
          data={data.tournament_wins}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Buy-Ins"
          valueKey="career_rebuys"
          data={data.rebuys}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
    </ul>
  );
}

export default SeasonRecords;
