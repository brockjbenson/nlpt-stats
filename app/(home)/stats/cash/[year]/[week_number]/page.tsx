import PageHeader from "@/components/page-header/page-header";
import SessionOverview from "@/components/sessions/session-overview";
import SessionTable from "@/components/sessions/session-table";
import { createClient } from "@/utils/supabase/server";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ year: string; week_number: string }>;
}

async function Page({ params }: Props) {
  const { year, week_number } = await params;
  const db = await createClient();

  const [
    { data: season, error: seasonError },
    { data: week, error: weekError },
  ] = await Promise.all([
    db.from("season").select("*").eq("year", year),
    db.from("week").select("*").eq("week_number", week_number),
  ]);

  if (seasonError) {
    return (
      <>
        <PageHeader title={`Week ${week_number}, ${year}`} />
        <p className="px-2">
          Error fetching Season data: {seasonError.message}
        </p>
      </>
    );
  }

  if (weekError) {
    return (
      <>
        <PageHeader title={`Week ${week_number}, ${year}`} />
        <p className="px-2">Error fetching Week data: {weekError.message}</p>;
      </>
    );
  }
  const { data: sessionData, error: sessionDataError } = await db.rpc(
    "get_cash_session_info",
    {
      current_season_id: season[0].id,
      current_week_id: week[0].id,
    }
  );

  if (sessionDataError) {
    return (
      <>
        <PageHeader title={`Week ${week_number}, ${year}`} />
        <p className="px-2">
          Error fetching Session data: {sessionDataError.message}
        </p>
      </>
    );
  }

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*)`)
    .eq("season_id", season[0].id)
    .eq("week_id", week[0].id)
    .filter("buy_in", "gt", 0);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  return (
    <>
      <PageHeader title={`Week ${week_number}, ${year}`} />
      {sessions.length === 0 ? (
        <p className="text-muted mt-12 text-center mx-auto">
          No sessions recorded for this week
        </p>
      ) : (
        <>
          <SessionOverview data={sessionData} />
          <SessionTable data={sessionData} />
        </>
      )}
    </>
  );
}

export default Page;
