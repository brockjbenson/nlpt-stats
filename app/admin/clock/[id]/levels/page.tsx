import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import ClockLevelsEditor from "@/features/clock/components/levels/clock-levels-editor";
import { getClock, getServerNowMs } from "@/features/clock/data/clocks";
import { clockControlPath } from "@/features/clock/lib/paths";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

const TITLE = "Levels";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: clock, error }, nowMs] = await Promise.all([
    getClock(db, id),
    getServerNowMs(db),
  ]);

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching the clock"
        errorMessage={error.message}
        pageTitle={TITLE}
      />
    );
  }
  if (!clock) notFound();
  // A finished clock's levels can't change.
  if (clock.status === "finished") redirect(clockControlPath(id));

  return (
    <>
      <PageHeader title={TITLE} />
      {/* The clock's name heads the editor. */}
      <DesktopPageHeader title={TITLE} />
      {/* A page you leave stays mounted, hidden, and shows again when you
          come back (see components/page-transition.tsx). Keyed by the time
          it was rendered, so each visit starts a fresh draft instead of one
          left behind. */}
      <ClockLevelsEditor
        key={nowMs}
        initialClock={clock}
        initialNowMs={nowMs}
      />
    </>
  );
}

export default Page;
