import PageHeader from "@/components/page-header/page-header";
import TournamentsHeaderSkeleton from "../../_components/header-skeleton";
import TournamentsSkeleton from "../../_components/tournaments-skeleton";

// A season's tournaments. Lives in the (list) group so this skeleton doesn't
// also cover the single tournament page at /tournaments/{year}/{id}.
export default function Loading() {
  return (
    <>
      <PageHeader skeleton>
        <TournamentsHeaderSkeleton />
      </PageHeader>
      <TournamentsSkeleton />
    </>
  );
}
