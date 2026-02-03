import Loading from "@/components/loading";
import PageHeader from "@/components/page-header/page-header";
import React, { Suspense } from "react";
import ComparePage from "./_components/main";

function page() {
  return (
    <>
      <PageHeader title="Compare Members" showBackButton />
      <Suspense fallback={<Loading />}>
        <ComparePage />
      </Suspense>
    </>
  );
}

export default page;
