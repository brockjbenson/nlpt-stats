import PageHeader from "@/components/page-header/page-header";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import { SeasonTabsSkeleton } from "@/components/page-header/season-tabs";
import StatsHeaderSkeleton, {
  StatsDesktopViewTabsSkeleton,
} from "./_components/header-skeleton";
import StatsSkeleton from "./_components/stats-skeleton";

// Covers every stats page (cumulative / cash / tournament, by year or
// career); they share one layout.
export default function Loading() {
  return (
    <>
      <PageHeader skeleton className="pb-0">
        <StatsHeaderSkeleton />
      </PageHeader>
      <DesktopPageHeader title="Stats">
        <StatsDesktopViewTabsSkeleton />
        <SeasonTabsSkeleton />
      </DesktopPageHeader>
      <StatsSkeleton />
    </>
  );
}
