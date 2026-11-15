import StatsHeader from "../../_components/header";
import { Suspense } from "react";
import StatsMain from "../../_components/main";
import StatsSkeleton from "../../_components/stats-skeleton";

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

async function page({ params }: PageProps) {
  const { year } = await params;

  return (
    <>
      <StatsHeader
        triggerLabel={year}
        view="cash"
        isCareer={false}
        year={year}
      />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsMain view="cash" year={year} />
      </Suspense>
    </>
  );
}

export default page;
