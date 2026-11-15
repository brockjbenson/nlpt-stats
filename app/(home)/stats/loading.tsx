import PageHeader from "@/components/page-header/page-header";
import StatsHeaderSkeleton from "./_components/header-skeleton";
import StatsSkeleton from "./_components/stats-skeleton";

// Covers every stats page (cumulative / cash / tournament, by year or
// career); they share one layout.
export default function Loading() {
  return (
    <>
      <PageHeader skeleton className="pb-0">
        <StatsHeaderSkeleton />
      </PageHeader>
      <StatsSkeleton />
    </>
  );
}
