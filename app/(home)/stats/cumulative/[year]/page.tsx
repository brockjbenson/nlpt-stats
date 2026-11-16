import StatsMain from "../../_components/main";
import StatsHeader from "../../_components/header";
import { Suspense } from "react";
import StatsSkeleton from "../../_components/stats-skeleton";
import { seasonYearParams } from "@/lib/data/static-params";

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
        view="cumulative"
        isCareer={false}
        year={year}
      />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsMain view="cumulative" year={year} />
      </Suspense>
    </>
  );
}

// Prebuilt with data at deploy time; see lib/data/static-params.ts.
export const generateStaticParams = seasonYearParams;

export default page;
