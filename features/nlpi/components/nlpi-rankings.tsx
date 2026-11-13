"use client";

import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { NLPIData } from "../lib/types";
import RankMovement from "./rank-movement";

type RankingRow = NLPIData & { previousYear: number | null };

interface Props {
  data: RankingRow[];
  portraits: Record<string, string | null>;
}

const MEDAL_COLORS = ["text-amber-400", "text-zinc-300", "text-amber-700"];
const MEDAL_RINGS = ["ring-amber-400", "ring-zinc-300", "ring-amber-700"];

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
            row={row}
            portrait={portraits[row.member_id]}
            maxTotal={maxTotal}
          />
        ))}
      </ul>
    </div>
  );
}

function PointsLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm bg-primary" /> Cash
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm bg-sky-400" /> Major
      </span>
    </div>
  );
}

function PointsBar({
  row,
  maxTotal,
  className,
}: {
  row: NLPIData;
  maxTotal: number;
  className?: string;
}) {
  const scale = maxTotal > 0 ? 100 / maxTotal : 0;
  const cashWidth = Math.max(row.cash_points, 0) * scale;
  const majorWidth = Math.max(row.tournament_points, 0) * scale;
  return (
    <div
      className={cn(
        "flex h-1.5 w-full rounded-full bg-muted/15 overflow-hidden",
        className,
      )}
      role="img"
      aria-label={`${row.cash_points.toFixed(1)} cash points, ${row.tournament_points.toFixed(1)} major points`}
    >
      <div className="h-full bg-primary" style={{ width: `${cashWidth}%` }} />
      <div className="h-full bg-sky-400" style={{ width: `${majorWidth}%` }} />
    </div>
  );
}

// Cash and major points under the bar, colored to match it.
// Negative values (cash can go below zero) show in red.
function PointsBreakdown({ row }: { row: NLPIData }) {
  const parts = [
    { label: "Cash", value: row.cash_points, color: "text-primary" },
    { label: "Major", value: row.tournament_points, color: "text-sky-400" },
  ];
  return (
    <p className="mt-1 flex items-center gap-3 text-xs tabular-nums">
      {parts.map(({ label, value, color }) => (
        <span key={label} className="flex items-center gap-1">
          <span className="text-muted">{label}</span>
          <span
            className={cn("font-semibold", value < 0 ? "text-red-600" : color)}
          >
            {value.toFixed(1)}
          </span>
        </span>
      ))}
    </p>
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

function RankingCard({
  row,
  portrait,
  maxTotal,
}: {
  row: RankingRow;
  portrait: string | null | undefined;
  maxTotal: number;
}) {
  const droppingOff = row.session_coming_off;
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-x-3 py-3">
        <span
          className={cn(
            // self-start + mt-2: line up with the name/bar/breakdown block
            "self-start mt-2 h-10 leading-10 text-center text-base font-bold tabular-nums",
            MEDAL_COLORS[row.rank - 1] ?? "text-muted",
          )}
        >
          {row.rank}
        </span>
        <Link
          href={`/members/${row.member_id}`}
          aria-label={`View ${row.first_name} ${row.last_name}`}
          className="self-start mt-2 rounded-full"
        >
          <MemberImage
            loading="lazy"
            src={portrait ?? ""}
            alt={row.first_name}
            className={cn(
              "w-10 h-10",
              MEDAL_RINGS[row.rank - 1] && [
                "ring-2",
                MEDAL_RINGS[row.rank - 1],
              ],
            )}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">
              {row.first_name} {row.last_name.slice(0, 1)}.
            </span>
            <RankMovement rank={row.rank} lastWeekRank={row.last_week_rank} />
          </div>
          <PointsBar row={row} maxTotal={maxTotal} className="mt-1.5" />
          <PointsBreakdown row={row} />
          <DropOffImpact session={droppingOff} />
        </div>
        <div className="text-right">
          <div className="font-bold tabular-nums">
            {row.total_points.toFixed(1)}
          </div>
          <div className="text-xs text-muted tabular-nums">
            {avgPoints(row).toFixed(2)} avg
          </div>
        </div>
      </div>
    </li>
  );
}

export default NLPIRankings;
