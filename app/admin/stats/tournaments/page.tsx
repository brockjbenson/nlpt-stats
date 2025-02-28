import YearCarousel from "@/components/tournament/year-carousel";
import { createClient } from "@/utils/supabase/server";
import { MajorsData, Tournament } from "@/utils/types";
import React from "react";
import TournamentCard from "@/components/tournament/tournament-card";
import ErrorHandler from "@/components/error-handler";

interface Props {
  searchParams: Promise<{
    year: string;
  }>;
}

async function Page({ searchParams }: Props) {
  const { year } = await searchParams;

  const db = await createClient();
  const [{ data: seasons, error: seasonsError }] = await Promise.all([
    db.from("season").select("*"),
  ]);

  if (seasonsError) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={seasonsError.message}
        pageTitle="Tournaments"
      />
    );
  }

  const { data: tournamentsData, error: tournamentsDataError } = await db.rpc(
    "get_majors_data",
    { target_season_year: year || null } // Ensure it is null if not set
  );

  if (tournamentsDataError) {
    return (
      <ErrorHandler
        title="Error fetching tournaments"
        errorMessage={tournamentsDataError.message}
        pageTitle="Tournaments"
      />
    );
  }
  return (
    <>
      <YearCarousel isAdmin seasons={seasons} year={year} />
      <h2 className="px-2 font-bold text-2xl">{year} Tournaments</h2>
      <div className="grid  grid-cols-1 px-2 md:grid-cols-3 gap-4">
        {tournamentsData.map((tournament: MajorsData) => (
          <TournamentCard isAdmin data={tournament} key={tournament.id} />
        ))}
      </div>
    </>
  );
}

export default Page;
