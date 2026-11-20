import PageHeader from "@/components/page-header/page-header";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import { SeasonTabsSkeleton } from "@/components/page-header/season-tabs";
import { RankingListSkeleton } from "@/components/rankings/ranking-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="POY Standings" />
      <DesktopPageHeader title="Player of the Year Standings">
        <SeasonTabsSkeleton />
      </DesktopPageHeader>
      <RankingListSkeleton />
    </>
  );
}
