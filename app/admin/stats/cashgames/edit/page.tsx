import { createClient } from "@/utils/supabase/server";
import React from "react";
import EditSessionForm from "../_components/edit-session-form";

interface Params {
  id: string;
}

async function Page(props: { searchParams: Promise<Params> }) {
  const { id } = await props.searchParams;
  const db = await createClient();

  const [
    { data: session, error: sessionError },
    { data: members, error: membersError },
    { data: seasons, error: seasonsError },
    { data: weeks, error: weeksError },
  ] = await Promise.all([
    db
      .from("cashSession")
      .select(
        `
        *,
        week:weekId(*),
        member:memberId(*),
        season:seasonId(*)
        `
      )
      .eq("id", id),
    db.from("members").select("*").order("firstName", { ascending: true }),
    db.from("season").select("*").order("year", { ascending: false }),
    db.from("week").select("*"),
  ]);

  // Handle errors
  if (sessionError) {
    return <p>Error fetching Session: {sessionError.message}</p>;
  }
  if (membersError) {
    return <p>Error fetching Members: {membersError.message}</p>;
  }
  if (seasonsError) {
    return <p>Error fetching Seasons: {seasonsError.message}</p>;
  }
  if (weeksError) {
    return <p>Error fetching Weeks: {weeksError.message}</p>;
  }

  return (
    <>
      <h2>Edit Session</h2>
      <EditSessionForm
        members={members}
        seasons={seasons}
        weeks={weeks}
        session={session[0]}
      />
    </>
  );
}

export default Page;
