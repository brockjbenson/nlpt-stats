import { Suspense } from "react";
import TournamentsHeader from "./_components/header";
import TournamentsMain from "./_components/main";
import Loading from "@/components/loading";

async function page() {
  return (
    <>
      <TournamentsHeader triggerLabel={"all"} isCareer={true} year={""} />
      <Suspense fallback={<Loading />}>
        <TournamentsMain year={""} />
      </Suspense>
    </>
  );
}

export default page;
