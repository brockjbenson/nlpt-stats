import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import ClockControls from "@/features/clock/components/control/clock-controls";
import { getClock, getServerNowMs } from "@/features/clock/data/clocks";
import {
  getClockPlayers,
  getMemberNames,
  playingMemberIds,
} from "@/features/clock/data/entrants";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

const TITLE = "Clock";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: clock, error: clockError }, players, nowMs] =
    await Promise.all([
      getClock(db, id),
      getClockPlayers(db, id),
      getServerNowMs(db),
    ]);
  // Members to pick from, plus any hidden member already playing.
  const members = await getMemberNames(
    db,
    playingMemberIds(players.data?.entrants ?? []),
  );
  const error = clockError ?? players.error ?? members.error;

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
        initialPlayers={players.data ?? { entrants: [], knockouts: [] }}
        members={members.data ?? []}
      />
    </>
  );
}

export default Page;
