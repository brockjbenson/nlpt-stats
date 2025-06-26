import { cn } from "@/lib/utils";
import { NLPIHistoricalRecord, RecordsData } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import React from "react";
import RecordAccordion from "./record";

interface Props {
  data: RecordsData["career"];
  className?: string;
  nlpiRecords: NLPIHistoricalRecord[];
}

function CareerRecords({ data, className, nlpiRecords }: Props) {
  const mostWeeksAtNumberOne = nlpiRecords.reduce(
    (topPlayer: NLPIHistoricalRecord, current) => {
      return current.total_weeks_at_1 > (topPlayer?.total_weeks_at_1 ?? -1)
        ? current
        : topPlayer;
    },
    nlpiRecords[0]
  );

  const mostConsecutiveWeeksAtNumberOne = nlpiRecords.reduce(
    (topPlayer: NLPIHistoricalRecord, current) => {
      return current.longest_consecutive_weeks_at_1 >
        (topPlayer?.longest_consecutive_weeks_at_1 ?? -1)
        ? current
        : topPlayer;
    },
    nlpiRecords[0]
  );

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
          title="Most Weeks at #1"
          valueKey="career_most_weeks_at_1"
          data={{
            first_name: mostWeeksAtNumberOne.first_name,
            last_name: mostWeeksAtNumberOne.last_name,
            portrait_url: mostWeeksAtNumberOne.portrait_url,
            value: mostWeeksAtNumberOne.total_weeks_at_1,
          }}
          getTextColor={() => ""}
          formatValue={(v) => `${v} weeks`}
        />
      </li>
      <li className="w-full">
        <RecordAccordion
          title="Longest Consecutive #1"
          valueKey="career_longest_streak_at_1"
          data={{
            first_name: mostConsecutiveWeeksAtNumberOne.first_name,
            last_name: mostConsecutiveWeeksAtNumberOne.last_name,
            portrait_url: mostConsecutiveWeeksAtNumberOne.portrait_url,
            value:
              mostConsecutiveWeeksAtNumberOne.longest_consecutive_weeks_at_1,
          }}
          getTextColor={() => ""}
          formatValue={(v) => `${v} weeks`}
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
          getTextColor={() => ""}
          formatValue={(v) => `${(v * 100).toFixed(2)}%`}
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
          title="Rebuys"
          valueKey="career_rebuys"
          data={data.rebuys}
          getTextColor={(v) => ""}
          formatValue={(v) => `${v}`}
        />
      </li>
    </ul>
  );
}

export default CareerRecords;
