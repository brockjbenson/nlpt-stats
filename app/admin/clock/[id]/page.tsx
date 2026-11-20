import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import ClockControls from "@/features/clock/components/control/clock-controls";
import { getClock, getServerNowMs } from "@/features/clock/data/clocks";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

const TITLE = "Clock";

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

  return (
    <>
      <PageHeader title={TITLE} />
      {/* The clock's name heads its card. */}
      <DesktopPageHeader title={TITLE} />
      <ClockControls initialClock={clock} initialNowMs={nowMs} />
    </>
  );
}

export default Page;
