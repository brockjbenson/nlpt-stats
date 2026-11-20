import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import ClockControls from "@/features/clock/components/control/clock-controls";
import { getClock, getServerNowMs } from "@/features/clock/data/clocks";
import {
  getEntrants,
  getKnockouts,
  getMemberNames,
} from "@/features/clock/data/entrants";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

const TITLE = "Clock";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: clock, error: clockError }, entrants, knockouts, nowMs] =
    await Promise.all([
      getClock(db, id),
      getEntrants(db, id),
      getKnockouts(db, id),
      getServerNowMs(db),
    ]);
  // Members to pick from, plus any hidden member already playing.
  const members = await getMemberNames(
    db,
    (entrants.data ?? []).flatMap(({ member_id }) =>
      member_id ? [member_id] : [],
    ),
  );
  const error =
    clockError ?? entrants.error ?? knockouts.error ?? members.error;

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
      <ClockControls
        initialClock={clock}
        initialNowMs={nowMs}
        initialPlayers={{
          entrants: entrants.data ?? [],
          knockouts: knockouts.data ?? [],
        }}
        members={members.data ?? []}
      />
    </>
  );
}

export default Page;
