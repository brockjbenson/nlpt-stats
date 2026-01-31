import TournamentsMain from "../_components/main";
import TournamentsHeader from "../_components/header";

import { Suspense } from "react";
import Loading from "@/components/loading";

interface Props {
  params: Promise<{ year: string }>;
}

async function page({ params }: Props) {
  const { year } = await params;

  return (
    <>
      <TournamentsHeader triggerLabel={year} isCareer={false} year={year} />
      <Suspense fallback={<Loading />}>
        <TournamentsMain year={year} />
      </Suspense>
    </>
  );
}

export default page;
