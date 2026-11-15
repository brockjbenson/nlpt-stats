import PageHeader from "@/components/page-header/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The home page lives in its own (overview) group so this skeleton only
// applies to "/", not to the other pages under (home).
export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="Home" />
      <div className="w-full mx-auto max-w-(--breakpoint-xl)">
        <div className="flex items-center justify-between px-2 w-full">
          <h1 className="text-xl font-bold md:text-2xl">Recent Session</h1>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="w-full max-w-(--breakpoint-xl) mx-auto mt-4 px-2">
          <Card className="w-full mb-8">
            <CardHeader>
              <CardTitle>Session Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col"
                aria-busy="true"
                aria-label="Loading">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5rem_repeat(3,1fr)] items-center gap-4 border-b border-border py-3 last:border-b-0">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
