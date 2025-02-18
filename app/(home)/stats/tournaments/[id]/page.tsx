import PageHeader from "@/components/page-header/page-header";
import TournamentInfo from "@/components/tournament/tournament-info-card";
import TournamentSessions from "@/components/tournament/tournament-sessions";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

async function Page({ params }: Props) {
  const { id } = await params;
  const db = await createClient();
  const { data: tournament, error: tournamentError } = await db
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (tournamentError) return <p>Error fetching tournament</p>;

  const { data: sessions, error: sessionsError } = await db
    .from("tournament_sessions")
    .select(
      `
      *,
      member:member_id(*)
    `
    )
    .eq("tournament_id", id);
  if (sessionsError)
    return <p>Error fetching sessions {sessionsError.message}</p>;

  return (
    <>
      <PageHeader title={"Tournament"} />
      <div className="w-full max-w-screen-xl mx-auto px-2">
        <h2 className="text-2xl w-full flex items-center justify-center mb-8">
          {tournament.name}
        </h2>
        <TournamentInfo tournament={tournament} sessions={sessions} />
        <TournamentSessions sessions={sessions} tournamentId={tournament.id} />
      </div>
    </>
  );
}

export default Page;
