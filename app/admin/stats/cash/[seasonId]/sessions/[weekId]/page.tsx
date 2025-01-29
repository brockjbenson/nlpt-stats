import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Params {
  params: Promise<{ seasonId: string; weekId: string }>;
}

async function Page({ params }: Params) {
  const { seasonId, weekId } = await params;
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("id", seasonId);
  if (seasonError) {
    return <p>Error fetching Season: {seasonError.message}</p>;
  }
  const { data: week, error: weekError } = await db
    .from("week")
    .select("*")
    .eq("id", weekId);
  if (weekError) {
    return <p>Error fetching Week: {weekError.message}</p>;
  }
  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*), week:week_id(*), season:season_id(*)`)
    .eq("week_id", weekId)
    .eq("season_id", seasonId);

  if (sessionError) {
    return <p>Error fetching Session: {sessionError.message}</p>;
  }
  return (
    <div>
      {season[0].year}: Week {week[0].week_number}
    </div>
  );
}

export default Page;
