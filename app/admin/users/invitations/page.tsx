import PageHeader from "@/components/page-header/page-header";
import React, { Suspense } from "react";
import PageHeaderSelect from "../_components/page-header-select";
import Loading from "@/components/loading";
import InvitationsMain from "./_components/main";

function page() {
  return (
    <>
      <PageHeader>
        <PageHeaderSelect page="invitations" />
      </PageHeader>
      <div className="px-4">
        <Suspense fallback={<Loading />}>
          <InvitationsMain />
        </Suspense>
      </div>
    </>
  );
}

export default page;
