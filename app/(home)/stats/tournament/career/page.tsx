import StatsMain from "../../_components/main";
import StatsHeader from "../../_components/header";
import { Suspense } from "react";
import StatsSkeleton from "../../_components/stats-skeleton";

function page() {
  return (
    <>
      <StatsHeader
        triggerLabel="career"
        view="tournament"
        isCareer={true}
        year="career"
      />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsMain view="tournament" year="career" />
      </Suspense>
    </>
  );
}

export default page;
