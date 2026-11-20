import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import StructureEditor from "@/features/clock/components/structures/structure-editor";
import { getStructure } from "@/features/clock/data/structures";
import { structureToDraft } from "@/features/clock/lib/structures";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

const TITLE = "Edit Template";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: structure, error } = await getStructure(db, id);

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching blind structure"
        errorMessage={error.message}
        pageTitle={TITLE}
      />
    );
  }
  if (!structure) notFound();

  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={structure.name} />
      <StructureEditor
        id={structure.id}
        initialDraft={structureToDraft(structure, structure.levels)}
      />
    </>
  );
}

export default Page;
