import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import RankMovement from "./rank-movement";

// Shared ranking list pieces for the NLPI and POY pages, so both read the
// same: a Cash/Major legend, and one card per member with rank (medal colors
// for the top 3), photo, name and movement, a Cash/Major points bar and
// breakdown, and the total on the right.

const MEDAL_COLORS = ["text-amber-400", "text-zinc-300", "text-amber-700"];
const MEDAL_RINGS = ["ring-amber-400", "ring-zinc-300", "ring-amber-700"];

export function PointsLegend() {
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

// Cash and major points as one bar, scaled so the top total fills it.
function PointsBar({
  cash,
  major,
  maxTotal,
  className,
}: {
  cash: number;
  major: number;
  maxTotal: number;
  className?: string;
}) {
  const scale = maxTotal > 0 ? 100 / maxTotal : 0;
  return (
    <div
      className={cn(
        "flex h-1.5 w-full rounded-full bg-muted/15 overflow-hidden",
        className,
      )}
      role="img"
      aria-label={`${cash.toFixed(1)} cash points, ${major.toFixed(1)} major points`}
    >
      <div
        className="h-full bg-primary"
        style={{ width: `${Math.max(cash, 0) * scale}%` }}
      />
      <div
        className="h-full bg-sky-400"
        style={{ width: `${Math.max(major, 0) * scale}%` }}
      />
    </div>
  );
}

// Cash and major points under the bar, colored to match it.
// Negative values (cash can go below zero) show in red.
function PointsBreakdown({ cash, major }: { cash: number; major: number }) {
  const parts = [
    { label: "Cash", value: cash, color: "text-primary" },
    { label: "Major", value: major, color: "text-sky-400" },
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

export function RankingCard({
  memberId,
  firstName,
  lastName,
  portrait,
  rank,
  lastWeekRank,
  cash,
  major,
  maxTotal,
  total,
  detail,
  children,
}: {
  memberId: string;
  firstName: string;
  lastName: string;
  portrait: string | null | undefined;
  rank: number;
  lastWeekRank: number | null;
  cash: number;
  major: number;
  // Largest total on the page; the bar is scaled to it.
  maxTotal: number;
  total: number;
  // Small line under the total (e.g. an average, or points behind).
  detail: React.ReactNode;
  // Extra content under the Cash/Major breakdown.
  children?: React.ReactNode;
}) {
  const medal = rank - 1;
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-x-3 py-3">
        <span
          className={cn(
            // self-start + mt-2: line up with the name/bar/breakdown block
            "self-start mt-2 h-10 leading-10 text-center text-base font-bold tabular-nums",
            MEDAL_COLORS[medal] ?? "text-muted",
          )}
        >
          {rank}
        </span>
        <Link
          href={`/members/${memberId}`}
          aria-label={`View ${firstName} ${lastName}`}
          className="self-start mt-2 rounded-full"
        >
          <MemberImage
            loading="lazy"
            src={portrait ?? ""}
            alt={firstName}
            className={cn(
              "w-10 h-10",
              MEDAL_RINGS[medal] && ["ring-2", MEDAL_RINGS[medal]],
            )}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">
              {firstName} {lastName.slice(0, 1)}.
            </span>
            <RankMovement rank={rank} lastWeekRank={lastWeekRank} />
          </div>
          <PointsBar
            cash={cash}
            major={major}
            maxTotal={maxTotal}
            className="mt-1.5"
          />
          <PointsBreakdown cash={cash} major={major} />
          {children}
        </div>
        <div className="text-right">
          <div className="font-bold tabular-nums">{total.toFixed(1)}</div>
          <div className="text-xs text-muted tabular-nums">{detail}</div>
        </div>
      </div>
    </li>
  );
}
