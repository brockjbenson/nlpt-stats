import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import RecordsComponent from "@/components/records/main";
import { createClient } from "@/utils/supabase/server";
import React from "react";

async function Records() {
  const db = await createClient();
  const [
    { data: recordsData, error: recordsError },
    { data: nlpiRecords, error: membersError },
  ] = await Promise.all([
    db.rpc("get_poy_records"),
    db.rpc("get_nlpi_rank_records", {
      target_member_id: null,
    }),
  ]);

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Records"
      />
    );
  }

  if (recordsError) {
    return (
      <ErrorHandler
        title="Error fetching records"
        errorMessage={recordsError.message}
        pageTitle="Records"
      />
    );
  }

  return (
    <>
      <PageHeader title="Records" />
      <RecordsComponent data={recordsData} nlpiRecords={nlpiRecords} />
    </>
  );
}

export default Records;
