import PageHeader from "@/components/page-header/page-header";
import { RankingListSkeleton } from "@/components/rankings/ranking-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader skeleton title="NLPI Rankings" />
      <RankingListSkeleton comingOff />
    </>
  );
}
