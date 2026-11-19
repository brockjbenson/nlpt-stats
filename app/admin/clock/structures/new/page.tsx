import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import StructureEditor from "@/features/clock/components/structures/structure-editor";
import { newStructureDraft } from "@/features/clock/lib/structures";

const TITLE = "New Template";

function Page() {
  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={TITLE} />
      <StructureEditor id={null} initialDraft={newStructureDraft()} />
    </>
  );
}

export default Page;
