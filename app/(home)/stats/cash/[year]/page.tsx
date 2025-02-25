import SessionsOverview from "@/components/sessions/overview";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Props {
  params: Promise<{ year: string }>;
}

async function Page({ params }: Props) {
  const { year } = await params;
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  const { data: weeks, error: weekError } = await db
    .from("week")
    .select("*")
    .eq("seasonId", season[0].id);

  if (weekError) {
    return <p>Error fetching Week data: {weekError.message}</p>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("cashSession")
    .select(`*, member:memberId (firstName)`)
    .in(
      "weekId",
      weeks.map((week) => week.id) // Only include weeks for this season
    );

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  return (
    <>
      <h1>{year} Cash Sessions</h1>
      <SessionsOverview sessions={sessions} />
    </>
  );
}

export default Page;
