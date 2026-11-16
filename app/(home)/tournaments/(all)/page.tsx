import { Suspense } from "react";
import TournamentsHeader from "../_components/header";
import TournamentsMain from "../_components/main";
import TournamentsSkeleton from "../_components/tournaments-skeleton";

async function page() {
  return (
    <>
      <TournamentsHeader triggerLabel={"all"} isCareer={true} year={""} />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsMain year={""} />
      </Suspense>
    </>
  );
}

export default page;
