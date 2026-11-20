import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import ClockList from "@/features/clock/components/clocks/clock-list";
import { getClocks } from "@/features/clock/data/clocks";
import { createClient } from "@/utils/supabase/server";

const TITLE = "Clocks";

async function Page() {
  const db = await createClient();
  const { data: clocks, error } = await getClocks(db);

  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={TITLE} />
      {error ? (
        <ErrorHandler
          title="Error fetching clocks"
          errorMessage={error.message}
          pageTitle={TITLE}
        />
      ) : (
        <ClockList clocks={clocks} />
      )}
    </>
  );
}

export default Page;
