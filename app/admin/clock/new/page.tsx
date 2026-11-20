import { ADMIN_ACTION_CLASS } from "@/components/admin-nav/admin-action";
import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import CreateClockForm from "@/features/clock/components/clocks/create-clock-form";
import { getStructures } from "@/features/clock/data/structures";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const TITLE = "New Clock";

async function Page() {
  const db = await createClient();
  const { data: structures, error } = await getStructures(db);

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching blind structures"
        errorMessage={error.message}
        pageTitle={TITLE}
      />
    );
  }

  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={TITLE} />
      {structures.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Blind Structures</EmptyTitle>
            <EmptyDescription>
              A clock starts from a template. Add one first.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              className={ADMIN_ACTION_CLASS}
              href="/admin/clock/structures/new"
            >
              Add Template
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <CreateClockForm structures={structures} />
      )}
    </>
  );
}

export default Page;
