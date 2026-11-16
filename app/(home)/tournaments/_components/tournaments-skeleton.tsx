import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const STATS = [
  { label: "Prize Pool", align: "items-start" },
  { label: "Total Buy-Ins", align: "items-center" },
  { label: "Players", align: "items-end" },
];

// Loading placeholder for the tournament list: cards with the name and date,
// the winner, and prize pool / buy-ins / players, on the same boxes as the
// real cards.
function TournamentsSkeleton() {
  return (
    <div
      className="grid w-full grid-cols-1 px-2 pb-4 md:grid-cols-2 gap-4 md:gap-8"
      aria-busy="true"
      aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="flex h-6 items-center">
              <Skeleton className="h-4 w-44" />
            </span>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2 justify-center items-center">
            <span className="text-muted text-sm">Winner</span>
            <div className="grid grid-cols-[50px_1fr] gap-2 items-center">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-3">
            {STATS.map(({ label, align }) => (
              <div key={label} className={`flex flex-col ${align}`}>
                <span className="text-xs text-muted">{label}</span>
                <span className="flex h-6 items-center">
                  <Skeleton className="h-4 w-12" />
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default TournamentsSkeleton;
