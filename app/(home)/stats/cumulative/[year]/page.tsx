import StatsMain from "../../_components/main";
import StatsHeader from "../../_components/header";
import { Suspense } from "react";
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
        view="cumulative"
        isCareer={false}
        year={year}
      />
      <Suspense fallback={<Loading />}>
        <StatsMain view="cumulative" year={year} />
      </Suspense>
    </>
  );
}

export default page;
