import PageHeader from "@/components/page-header/page-header";
import CompareSkeleton from "./_components/compare-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader skeleton showBackButton title="Compare Members" />
      <CompareSkeleton />
    </>
  );
}
