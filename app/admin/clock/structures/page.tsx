import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import StructureList from "@/features/clock/components/structures/structure-list";
import { getStructures } from "@/features/clock/data/structures";
import { createClient } from "@/utils/supabase/server";

const TITLE = "Blind Structures";

async function Page() {
  const db = await createClient();
  const { data: structures, error } = await getStructures(db);

  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={TITLE} />
      {error ? (
        <ErrorHandler
          title="Error fetching blind structures"
          errorMessage={error.message}
          pageTitle={TITLE}
        />
      ) : (
        <StructureList structures={structures} />
      )}
    </>
  );
}

export default Page;
