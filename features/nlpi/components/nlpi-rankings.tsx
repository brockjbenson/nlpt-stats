"use client";

import { PointsLegend, RankingCard } from "@/components/rankings/ranking-card";
import { cn } from "@/lib/utils";
import React from "react";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { NLPIData } from "../lib/types";

type RankingRow = NLPIData & { previousYear: number | null };

interface Props {
  data: RankingRow[];
  portraits: Record<string, string | null>;
}

function avgPoints(row: NLPIData): number {
  return row.divisor ? row.total_points / row.divisor : 0;
}

type DropWeek = { week: number; season: number };

function dropKey(w: DropWeek) {
  return `${w.season}-${w.week}`;
}

// "Week 10", or "Week 45 (2025)" when the week is from another season
function formatDropWeek(w: DropWeek, currentSeason: number | null) {
  return w.season === currentSeason
    ? `Week ${w.week}`
    : `Week ${w.week} (${w.season})`;
}

// The week most members drop next. Returned only when every member with a
// drop-off session shares it, so it can be stated once above the list.
function sharedDropWeek(rows: NLPIData[]): DropWeek | null {
  const weeks = rows
    .map((r) => r.session_coming_off)
    .filter((s): s is NonNullable<typeof s> => s?.week != null);
  if (weeks.length === 0) return null;
  const first = weeks[0];
  return weeks.every((w) => dropKey(w) === dropKey(first))
    ? { week: first.week, season: first.season }
    : null;
}

function NLPIRankings({ data, portraits }: Props) {
  const ranked = React.useMemo(
    () => [...data].sort((a, b) => a.rank - b.rank),
    [data],
  );
  const maxTotal = Math.max(...ranked.map((r) => r.total_points), 0);
  const currentSeason =
    data[0]?.previousYear != null ? data[0].previousYear + 1 : null;
  const sharedWeek = sharedDropWeek(ranked);

  return (
    <div className="w-full">
      <div className="mb-4">
        <PointsLegend />
      </div>

      {sharedWeek && (
        <p className="mb-2 text-xs text-muted">
          <span className="font-semibold text-foreground">
            {formatDropWeek(sharedWeek, currentSeason)}
          </span>{" "}
          is coming off next. Points shown are what that session was worth.
        </p>
      )}

      <ul className="flex flex-col">
        {ranked.map((row) => (
          <RankingCard
            key={row.member_id}
            memberId={row.member_id}
            firstName={row.first_name}
            lastName={row.last_name}
            portrait={portraits[row.member_id]}
            rank={row.rank}
            lastWeekRank={row.last_week_rank}
            cash={row.cash_points}
            major={row.tournament_points}
            maxTotal={maxTotal}
            total={row.total_points}
            detail={`${avgPoints(row).toFixed(2)} avg`}
          >
            <DropOffImpact session={row.session_coming_off} />
          </RankingCard>
        ))}
      </ul>
    </div>
  );
}

// The member's oldest session in the window, which comes off next. A week
// they missed still counts (as a 0) and still comes off, so it's shown as
// "Didn't play". So is a newer member with no session found to come off yet
// (fewer than 20 cash sessions).
function DropOffImpact({
  session,
}: {
  session: NLPIData["session_coming_off"];
}) {
  const points = session?.nlpi_points ?? 0;
  const netProfit = session?.net_profit ?? 0;
  // A missed week comes back as a row with no buy-in (and 0 points / $0); a
  // newer member's comes back with no week at all.
  const didNotPlay = session?.week == null || !session.buy_in;

  return (
    <div className="mt-2 pt-3 border-t border-border text-xs">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Session Coming Off
      </p>
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <span>
          <span className="text-muted">NLPI Points</span>{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {points.toFixed(1)}
          </span>
        </span>
        {didNotPlay ? (
          <span className="text-muted">Didn&apos;t play</span>
        ) : (
          <span>
            <span className="text-muted">Net Profit</span>{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                getProfitTextColor(netProfit),
              )}
            >
              {formatMoney(netProfit)}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}

export default NLPIRankings;
