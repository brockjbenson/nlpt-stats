import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// One line of text-xs (16px tall) with a bar standing in for the words.
function TextLine({ className }: { className?: string }) {
  return (
    <span className="flex h-4 items-center">
      <Skeleton className={className ?? "h-3 w-24"} />
    </span>
  );
}

// Loading placeholder for the NLPI and POY ranking cards. Rows are built on
// the same line boxes as the real cards (rank, photo, name / points bar /
// breakdown, total) so the page doesn't jump when the data arrives.
// `comingOff` adds NLPI's "Week N is coming off next" note and each card's
// "Session coming off" block.
export function RankingListSkeleton({
  rows = 8,
  comingOff = false,
}: {
  rows?: number;
  comingOff?: boolean;
}) {
  return (
    <div className="w-full px-2 max-w-(--breakpoint-xl) mx-auto">
      <Card className="w-full mb-8">
        <CardContent>
          <div className="mb-4 flex h-4 items-center gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
          {comingOff && (
            <div className="mb-2 flex flex-wrap gap-x-1">
              <TextLine className="h-3 w-36" />
              <TextLine className="h-3 w-60" />
            </div>
          )}
          <ul className="flex flex-col" aria-busy="true" aria-label="Loading">
            {Array.from({ length: rows }, (_, i) => (
              <li key={i} className="border-b border-border last:border-b-0">
                <div className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-x-3 py-3">
                  <span className="self-start mt-2 flex h-10 items-center justify-center">
                    <Skeleton className="h-5 w-4" />
                  </span>
                  <Skeleton className="self-start mt-2 size-10 rounded-full" />
                  <div className="min-w-0">
                    <span className="flex h-6 items-center">
                      <Skeleton className="h-4 w-24" />
                    </span>
                    <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                    <div className="mt-1">
                      <TextLine className="h-3 w-28" />
                    </div>
                    {comingOff && (
                      <div className="mt-2 border-t border-border pt-3">
                        <span className="mb-1 flex h-[13px] items-center">
                          <Skeleton className="h-2.5 w-28" />
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          <TextLine className="h-3 w-[5.5rem]" />
                          <TextLine className="h-3 w-28" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex h-6 items-center">
                      <Skeleton className="h-4 w-12" />
                    </span>
                    <TextLine className="h-3 w-14" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
