import PageHeader from "@/components/page-header/page-header";
import SessionOverview from "@/components/sessions/session-overview";
import SessionTable from "@/components/sessions/session-table";
import { createClient } from "@/utils/supabase/server";
import React, { Suspense } from "react";
import Loading from "./loading";

interface Props {
  params: Promise<{ year: string; week_number: string }>;
}

async function Page({ params }: Props) {
  const { year, week_number } = await params;
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year);
  const { data: week, error: weekError } = await db
    .from("week")
    .select("*")
    .eq("week_number", week_number);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  if (weekError) {
    return <p>Error fetching Week data: {weekError.message}</p>;
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
      <Suspense fallback={<Loading />}>
        <PageHeader title={`Week ${week_number}, ${year}`} />
        {sessions.length === 0 ? (
          <p className="text-muted mt-12 text-center mx-auto">
            No sessions recorded for this week
          </p>
        ) : (
          <>
            <SessionOverview sessions={sessions} />
            <SessionTable sessions={sessions} />
          </>
        )}
      </Suspense>
    </>
  );
}

export default Page;
