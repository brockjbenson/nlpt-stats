import TournamentsMain from "../../_components/main";
import TournamentsHeader from "../../_components/header";

import { Suspense } from "react";
import TournamentsSkeleton from "../../_components/tournaments-skeleton";

interface Props {
  params: Promise<{ year: string }>;
}

async function page({ params }: Props) {
  const { year } = await params;

  return (
    <>
      <TournamentsHeader triggerLabel={year} isCareer={false} year={year} />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsMain year={year} />
      </Suspense>
    </>
  );
}

export default page;
