import TournamentSessionsForm from "@/components/tournament/tournament-sessions-form";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

async function Page({ params }: Props) {
  const { id } = await params;
  const db = await createClient();
  const [
    { data: members, error: membersError },
    { data: tournament, error: tournamentError },
  ] = await Promise.all([
    db.from("members").select("*").order("first_name", { ascending: true }),
    db.from("tournaments").select("*").eq("id", id).single(),
  ]);

  if (tournamentError)
    return <p>Error fetching tournament {tournamentError.message}</p>;
  if (membersError) return <p>Error fetching members {membersError.message}</p>;
  return (
    <div>
      <h2>Add Sessions for {tournament.name}</h2>
      <TournamentSessionsForm members={members} tournament={tournament} />
    </div>
  );
}

export default Page;
