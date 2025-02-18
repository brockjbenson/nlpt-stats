import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { Tournament } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import Link from "next/link";
import React from "react";
import YearCarousel from "../../../../components/tournament/year-carousel";
import TournamentCard from "@/components/tournament/tournament-card";

interface Props {
  searchParams: Promise<{
    year: string;
  }>;
}

async function Page({ searchParams }: Props) {
  const { year } = await searchParams;
  const db = await createClient();
  const [
    { data: seasons, error: seasonsError },
    { data: allTournaments, error: tournamentsError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("tournaments").select("*").order("date", { ascending: false }),
  ]);

  const { data: tournamentSessions, error: tournamentSessionsError } = await db
    .from("tournament_sessions")
    .select(
      `
      *,
      member:member_id(*)
    `
    );
  if (tournamentsError) return <p>Error fetching tournaments</p>;
  if (seasonsError) return <p>Error fetching members</p>;
  const tournaments = year
    ? allTournaments.filter((tournament) => {
        const tournamentYear = new Date(tournament.date).getFullYear();
        return tournamentYear === Number(year);
      })
    : allTournaments;

  if (tournamentSessionsError)
    return (
      <>
        <PageHeader title="Tournaments" />
        <p>Error Fetching Tournament Sessions</p>
      </>
    );
  return (
    <>
      <PageHeader title="Tournaments" />
      <YearCarousel seasons={seasons} year={year} />
      <div className="grid grid-cols-1 px-2 md:grid-cols-3 gap-4">
        {tournaments.map((tournament: Tournament) => (
          <TournamentCard
            sessions={tournamentSessions}
            key={tournament.id}
            tournament={tournament}
          />
        ))}
      </div>
    </>
  );
}

export default Page;
