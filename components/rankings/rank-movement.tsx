import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

interface Props {
  rank: number;
  lastWeekRank: number | null;
  className?: string;
}

// Spots moved since last week. last_week_rank of 0/null means the member
// wasn't ranked last week.
function RankMovement({ rank, lastWeekRank, className }: Props) {
  if (!lastWeekRank) {
    return (
      <span
        className={cn("text-xs font-semibold text-primary uppercase", className)}>
        New
      </span>
    );
  }

  const change = lastWeekRank - rank;

  if (change === 0) {
    return (
      <span
        aria-label="No change since last week"
        className={cn("flex items-center text-muted", className)}>
        <Minus size={14} />
      </span>
    );
  }

  const up = change > 0;
  return (
    <span
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(change)} since last week`}
      className={cn(
        "flex items-center gap-0.5 text-sm font-semibold",
        up ? "text-green-600" : "text-red-600",
        className,
      )}>
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(change)}
    </span>
  );
}

export default RankMovement;
