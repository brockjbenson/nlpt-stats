import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const INFO = [
  { label: "Prize Pool", align: "items-start" },
  { label: "Places Paid", align: "items-center" },
  { label: "Players", align: "items-end" },
  { label: "Rebuys", align: "items-start" },
  { label: "Total Buy-Ins", align: "items-center" },
  { label: "Date", align: "items-end" },
];

// Loading placeholder for a single tournament: its name, the info card
// (winner and totals) and the sessions table, on the same boxes as the real
// ones.
function TournamentSkeleton() {
  return (
    <div
      className="w-full max-w-(--breakpoint-xl) mx-auto px-2"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="my-4 flex h-7 items-center justify-center">
        <Skeleton className="h-6 w-56" />
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tournament Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2 justify-center items-center">
              <span className="text-sm text-muted md:text-base">Winner</span>
              <div className="grid grid-cols-[50px_1fr] gap-2 items-center">
                <Skeleton className="size-[50px] rounded-full" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>
            <div className="grid md:flex items-center justify-center w-full grid-cols-3 gap-3 md:gap-12">
              {INFO.map(({ label, align }) => (
                <div
                  key={label}
                  className={`flex flex-col gap-1 ${align} md:items-center justify-center`}
                >
                  <span className="text-sm text-muted md:text-base">
                    {label}
                  </span>
                  <span className="flex h-7 items-center">
                    <Skeleton className="h-5 w-12" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid h-8 grid-cols-[2.5rem_5rem_repeat(3,1fr)] items-center gap-x-4 border-b border-border">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-3 w-10" />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="grid h-12 grid-cols-[2.5rem_5rem_repeat(3,1fr)] items-center gap-x-4 border-b border-border last:border-b-0"
              >
                <Skeleton className="mx-auto size-6 rounded-full" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TournamentSkeleton;
