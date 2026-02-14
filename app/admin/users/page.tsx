import PageHeader from "@/components/page-header/page-header";
import { Suspense } from "react";
import AdminUsersMain from "./_components/main";
import Loading from "@/components/loading";
import PageHeaderSelect from "./_components/page-header-select";

function page() {
  return (
    <>
      <PageHeader>
        <PageHeaderSelect page="users" />
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <AdminUsersMain />
      </Suspense>
    </>
  );
}

export default page;
