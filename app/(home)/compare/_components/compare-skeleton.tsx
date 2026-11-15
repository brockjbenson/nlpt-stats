import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// One per stat row in CompareContent.
const STAT_ROWS = 14;

// Loading placeholder for Compare: the two member pickers (photo and select)
// and the stat rows, on the same boxes as the real ones.
function CompareSkeleton() {
  return (
    <div className="w-full px-2" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex flex-col items-center justify-center">
            <div className="flex w-full justify-center">
              <Skeleton className="w-3/5 aspect-square rounded-full" />
            </div>
            <div className="flex h-12 w-full items-center justify-center">
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Card className="w-full py-1 mt-4">
        <CardContent className="flex py-0 flex-col">
          {Array.from({ length: STAT_ROWS }, (_, i) => (
            <div
              key={i}
              className="grid h-8.25 grid-cols-3 items-center gap-4 border-b border-input last:border-b-0">
              <Skeleton className="mx-auto h-3 w-8" />
              <Skeleton className="mx-auto h-3 w-20" />
              <Skeleton className="mx-auto h-3 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default CompareSkeleton;
