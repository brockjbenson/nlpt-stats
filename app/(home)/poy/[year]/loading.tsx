import PageHeader from "@/components/page-header/page-header";
import { RankingListSkeleton } from "@/components/rankings/ranking-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="POY Standings" />
      <RankingListSkeleton />
    </>
  );
}
