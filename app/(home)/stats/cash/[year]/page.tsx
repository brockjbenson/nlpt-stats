import StatsHeader from "../../_components/header";
import { Suspense } from "react";
import StatsMain from "../../_components/main";
import Loading from "@/components/loading";

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
      <Suspense fallback={<Loading />}>
        <StatsMain view="cash" year={year} />
      </Suspense>
    </>
  );
}

export default page;
