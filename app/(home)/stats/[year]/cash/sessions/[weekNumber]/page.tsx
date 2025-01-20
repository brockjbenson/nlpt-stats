import SessionOverview from "@/components/sessions/session-overview";
import SessionTable from "@/components/sessions/session-table";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Props {
  params: Promise<{ year: string; weekNumber: string }>;
}

async function Page({ params }: Props) {
  const { year, weekNumber } = await params;
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year);
  const { data: week, error: weekError } = await db
    .from("week")
    .select("*")
    .eq("weekNumber", weekNumber);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  if (weekError) {
    return <p>Error fetching Week data: {weekError.message}</p>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("cashSession")
    .select(`*, member:memberId (firstName)`)
    .eq("seasonId", season[0].id)
    .eq("weekId", week[0].id);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  return (
    <>
      <h1>
        {year} : Week {weekNumber}
      </h1>
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
    </>
  );
}

export default Page;
