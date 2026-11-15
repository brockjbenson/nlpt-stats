import PageHeader from "@/components/page-header/page-header";
import React, { Suspense } from "react";
import ComparePage from "./_components/main";
import CompareSkeleton from "./_components/compare-skeleton";

function page() {
  return (
    <>
      <PageHeader title="Compare Members" showBackButton />
      <Suspense fallback={<CompareSkeleton />}>
        <ComparePage />
      </Suspense>
    </>
  );
}

export default page;
