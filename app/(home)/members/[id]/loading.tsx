import PageHeader from "@/components/page-header/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Member profile: portrait banner, the view tabs, then stat cards.
export default function Loading() {
  return (
    <>
      <PageHeader skeleton showBackButton className="mb-0" title="Member" />
      <div
        className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-md:-mt-4"
        aria-busy="true"
        aria-label="Loading">
        <Skeleton className="w-full aspect-[8/7.5] rounded-none" />
        <div className="flex flex-col gap-4 px-2">
          <div className="flex gap-4 border-b-[3px] border-neutral-700 pb-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </>
  );
}
