import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import FinishReview from "@/features/clock/components/finish/finish-review";
import { getClock } from "@/features/clock/data/clocks";
import {
  getClockPlayers,
  getMemberNames,
  type MemberOption,
  playingMemberIds,
} from "@/features/clock/data/entrants";
import { getSavedResults } from "@/features/clock/data/results";
import {
  type FinishForm,
  finishFormDefaults,
  finishFormFromSaved,
} from "@/features/clock/lib/finish-form";
import { clockControlPath } from "@/features/clock/lib/paths";
import { entrantNames } from "@/features/clock/lib/players";
import type { ClockEntrant } from "@/features/clock/types";
import { createClient } from "@/utils/supabase/server";
import type { Season, Week } from "@/utils/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";

const TITLE = "Results";

// member id → the name the form shows.
function memberNamesOf(
  entrants: ClockEntrant[],
  names: Map<string, string>,
): Map<string, string> {
  return new Map(
    entrants.flatMap(({ id, member_id }) =>
      member_id ? [[member_id, names.get(id) ?? "Member"] as const] : [],
    ),
  );
}

async function getSeasonsAndWeeks(db: SupabaseClient) {
  const [seasons, weeks] = await Promise.all([
    db.from("season").select("*").order("year", { ascending: false }),
    db.from("week").select("*").order("week_number", { ascending: false }),
  ]);
  return {
    seasons: (seasons.data ?? []) as Season[],
    weeks: (weeks.data ?? []) as Week[],
    error: seasons.error ?? weeks.error,
  };
}

// The form to show: the clock's results, or, once saved, what was saved
// (so a re-save edits it rather than starting again from the clock).
async function formToEdit({
  db,
  tournamentId,
  defaultForm,
  entrants,
  members,
  weeks,
}: {
  db: SupabaseClient;
  tournamentId: string | null;
  defaultForm: FinishForm;
  entrants: ClockEntrant[];
  members: MemberOption[];
  weeks: Week[];
}): Promise<{ form: FinishForm } | { error: string }> {
  if (!tournamentId) return { form: defaultForm };
  const saved = await getSavedResults(db, tournamentId);
  if (saved.error) return { error: saved.error.message };
  // The tournament was deleted since: start again from the clock.
  if (!saved.data) return { form: defaultForm };
  return {
    form: finishFormFromSaved({
      ...saved.data,
      memberNames: memberNamesOf(entrants, entrantNames(entrants, members)),
      weeks,
    }),
  };
}

function ShowError({ message }: { message: string }) {
  return (
    <ErrorHandler
      title="Error loading the results"
      errorMessage={message}
      pageTitle={TITLE}
    />
  );
}

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: clock, error: clockError }, players, seasonsAndWeeks] =
    await Promise.all([
      getClock(db, id),
      getClockPlayers(db, id),
      getSeasonsAndWeeks(db),
    ]);
  const loadError = clockError ?? players.error ?? seasonsAndWeeks.error;
  if (loadError) return <ShowError message={loadError.message} />;
  if (!clock || !players.data) notFound();
  if (clock.status !== "finished") redirect(clockControlPath(id));

  const { entrants } = players.data;
  const { seasons, weeks } = seasonsAndWeeks;
  const members = await getMemberNames(db, playingMemberIds(entrants));
  if (members.error) return <ShowError message={members.error.message} />;

  const defaults = finishFormDefaults({
    clock,
    entrants,
    members: members.data,
    seasons,
  });
  if (!defaults.ok) {
    return (
      <ShowError message="Every player needs a finishing place. Reopen the clock and finish it again." />
    );
  }

  const form = await formToEdit({
    db,
    tournamentId: clock.tournament_id,
    defaultForm: defaults.value.form,
    entrants,
    members: members.data,
    weeks,
  });
  if ("error" in form) return <ShowError message={form.error} />;

  return (
    <>
      <PageHeader title={TITLE} />
      <DesktopPageHeader title={`${clock.name} · Results`} />
      <FinishReview
        clockId={clock.id}
        initialForm={form.form}
        guests={defaults.value.guests}
        seasons={seasons}
        weeks={weeks}
        savedTournamentId={clock.tournament_id}
      />
    </>
  );
}

export default Page;
