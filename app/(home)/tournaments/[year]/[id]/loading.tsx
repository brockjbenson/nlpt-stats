import PageHeader from "@/components/page-header/page-header";
import TournamentSkeleton from "./_components/tournament-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader skeleton showBackButton title="Tournament" />
      <TournamentSkeleton />
    </>
  );
}
