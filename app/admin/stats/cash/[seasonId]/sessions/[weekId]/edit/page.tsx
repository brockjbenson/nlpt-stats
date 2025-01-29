import { createClient } from "@/utils/supabase/server";
import React from "react";
import EditSessionForm from "../../../../_components/edit-session-form";
import SessionsList from "@/components/admin/stats/sessions-list";
interface Params {
  params: Promise<{ seasonId: string; weekId: string }>;
}

async function Page({ params }: Params) {
  const { seasonId, weekId } = await params;
  const db = await createClient();

  if (!seasonId || !weekId) {
    console.error("Invalid UUIDs passed to Supabase function.");
  }

  const { data: members, error: membersError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (membersError) {
    return <p>Error fetching Members: {membersError.message}</p>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*), week:week_id(*), season:season_id(*)`)
    .eq("week_id", weekId)
    .eq("season_id", seasonId);

  if (sessionError) {
    return <p>Error fetching Session: {sessionError.message}</p>;
  }

  // Handle errors

  return (
    <>
      <EditSessionForm sessions={sessions} />
    </>
  );
}

export default Page;
