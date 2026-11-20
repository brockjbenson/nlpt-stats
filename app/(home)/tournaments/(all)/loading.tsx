import PageHeader from "@/components/page-header/page-header";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import { SeasonTabsSkeleton } from "@/components/page-header/season-tabs";
import TournamentsHeaderSkeleton from "../_components/header-skeleton";
import TournamentsSkeleton from "../_components/tournaments-skeleton";

// All tournaments. Lives in the (all) group so this skeleton only applies to
// /tournaments, not the year and tournament pages under it.
export default function Loading() {
  return (
    <>
      <PageHeader skeleton>
        <TournamentsHeaderSkeleton />
      </PageHeader>
      <DesktopPageHeader title="Tournaments">
        <SeasonTabsSkeleton />
      </DesktopPageHeader>
      <TournamentsSkeleton />
    </>
  );
}
