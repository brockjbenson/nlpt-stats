import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// Loading placeholder for the stats pages: the leader card carousel (first
// card, then previous / dots / next) and the stats table, on the same boxes
// as the real ones so the page doesn't jump when the data arrives.
function StatsSkeleton() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading">
      <div className="px-2">
        <Card className="relative">
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <span className="absolute underline top-2 right-4 text-muted text-sm">
            Full List
          </span>
          <CardContent className="mt-3">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center mt-4 justify-center gap-8">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="size-3 rounded-full" />
          ))}
        </div>
        <Skeleton className="size-8 rounded-full" />
      </div>

      <div className="overflow-hidden px-2 mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <div className="grid h-8 grid-cols-[5rem_repeat(3,1fr)] items-center gap-x-4 border-b border-border">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-3 w-14" />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="grid h-12 grid-cols-[5rem_repeat(3,1fr)] items-center gap-x-4 border-b border-border last:border-b-0">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StatsSkeleton;
