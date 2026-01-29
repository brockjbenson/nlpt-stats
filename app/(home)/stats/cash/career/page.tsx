import StatsMain from "../../_components/main";
import StatsHeader from "../../_components/header";
import { Suspense } from "react";
import Loading from "@/components/loading";

function page() {
  return (
    <>
      <StatsHeader
        triggerLabel="career"
        view="cash"
        isCareer={true}
        year="career"
      />
      <Suspense fallback={<Loading />}>
        <StatsMain view="cash" year="career" />
      </Suspense>
    </>
  );
}

export default page;
