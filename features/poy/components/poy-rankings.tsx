import { PointsLegend, RankingCard } from "@/components/rankings/ranking-card";
import { POYData } from "@/utils/types";
import React from "react";

interface Props {
  data: POYData[];
  portraits: Record<string, string | null>;
}

// POY standings as ranking cards, matching the NLPI page. Under each total:
// how far behind the leader they are ("Leader" for the top spot).
function POYRankings({ data, portraits }: Props) {
  const ranked = [...data].sort((a, b) => a.rank - b.rank);
  const leaderTotal = Math.max(...ranked.map((r) => r.total_points), 0);

  return (
    <div className="w-full">
      <div className="mb-4">
        <PointsLegend />
      </div>
      <ul className="flex flex-col">
        {ranked.map((row) => {
          const behind = leaderTotal - row.total_points;
          return (
            <RankingCard
              key={row.member_id}
              memberId={row.member_id}
              firstName={row.first_name}
              lastName={row.last_name}
              portrait={portraits[row.member_id]}
              rank={row.rank}
              lastWeekRank={row.last_week_rank}
              cash={row.cash_points}
              major={row.major_points ?? 0}
              maxTotal={leaderTotal}
              total={row.total_points}
              detail={behind < 0.05 ? "Leader" : `${behind.toFixed(1)} back`}
            />
          );
        })}
      </ul>
    </div>
  );
}

export default POYRankings;
