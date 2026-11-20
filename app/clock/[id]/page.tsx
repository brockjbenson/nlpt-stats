import ErrorHandler from "@/components/error-handler";
import ClockDisplay from "@/features/clock/components/display/clock-display";
import { getClock, getServerNowMs } from "@/features/clock/data/clocks";
import {
  getEntrants,
  getKnockouts,
  getMemberNames,
} from "@/features/clock/data/entrants";
import { createPublicClient } from "@/utils/supabase/public";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = { params: Promise<{ id: string }> };

// Shared by the title and the page, so the clock is read once per request.
// The cookie-free client: anyone can watch a clock, signed in or not.
const loadClock = cache((id: string) => getClock(createPublicClient(), id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: clock } = await loadClock(id);
  return { title: clock ? clock.name : "Tournament Clock" };
}

async function Page({ params }: Props) {
  const { id } = await params;
  const db = createPublicClient();
  const [{ data: clock, error: clockError }, entrants, knockouts, nowMs] =
    await Promise.all([
      loadClock(id),
      getEntrants(db, id),
      getKnockouts(db, id),
      getServerNowMs(db),
    ]);
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
      <div className="py-4">
        <ErrorHandler
          title="Error fetching the clock"
          errorMessage={error.message}
        />
      </div>
    );
  }
  if (!clock) notFound();

  return (
    <ClockDisplay
      initialClock={clock}
      initialNowMs={nowMs}
      initialPlayers={{
        entrants: entrants.data ?? [],
        knockouts: knockouts.data ?? [],
      }}
      members={members.data ?? []}
    />
  );
}

export default Page;
