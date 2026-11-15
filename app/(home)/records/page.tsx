import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import RecordsComponent from "@/features/records/components/main";
import { getNlpiRankRecords, getPoyRecords } from "@/lib/data/league";

async function Records() {
  const [
    { data: recordsData, error: recordsError },
    { data: nlpiRecords, error: membersError },
  ] = await Promise.all([
    getPoyRecords(),
    getNlpiRankRecords(null),
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
