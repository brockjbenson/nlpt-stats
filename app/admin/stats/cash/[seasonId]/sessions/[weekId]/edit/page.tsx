import { createClient } from "@/utils/supabase/server";
import React from "react";
import EditSessionForm from "../../../../_components/edit-session-form";
import PageHeader from "@/components/page-header/page-header";
import ErrorHandler from "@/components/error-handler";
interface Params {
  params: Promise<{ seasonId: string; weekId: string }>;
}

async function Page({ params }: Params) {
  const { seasonId, weekId } = await params;
  const db = await createClient();

  if (!seasonId || !weekId) {
    console.error("Invalid UUIDs passed to Supabase function.");
  }

  const [
    { data: sessions, error: sessionsError },
    { data: week, error: weekError },
    { data: season, error: seasonError },
  ] = await Promise.all([
    db
      .from("cash_session")
      .select(`*, member:member_id(*), week:week_id(*), season:season_id(*)`)
      .eq("week_id", weekId)
      .eq("season_id", seasonId),
    db.from("week").select("*").eq("id", weekId).single(),
    db.from("season").select("*").eq("id", seasonId).single(),
  ]);

  if (sessionsError) {
    return (
      <ErrorHandler
        errorMessage={sessionsError.message}
        title="Error fetching sessions"
        pageTitle="Edit Sessions"
      />
    );
  }

  if (weekError) {
    return (
      <ErrorHandler
        errorMessage={weekError.message}
        title="Error fetching week"
        pageTitle="Edit Sessions"
      />
    );
  }

  if (seasonError) {
    return (
      <ErrorHandler
        errorMessage={seasonError.message}
        title="Error fetching season"
        pageTitle="Edit Sessions"
      />
    );
  }

  // Handle errors

  return (
    <>
      <PageHeader title="Edit Sessions" />
      <EditSessionForm week={week} season={season} sessions={sessions} />
    </>
  );
}

export default Page;
