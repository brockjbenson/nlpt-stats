import YearCarousel from "@/components/tournament/year-carousel";
import { createClient } from "@/utils/supabase/server";
import { MajorsData, Tournament } from "@/utils/types";
import React from "react";
import TournamentCard from "@/components/tournament/tournament-card";
import ErrorHandler from "@/components/error-handler";
import TournamentsMain from "@/components/tournament/tournaments-main";
import PageHeader from "@/components/page-header/page-header";

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
      <PageHeader title="Tournaments" />
      <TournamentsMain
        isAdmin={true}
        tournamentsData={tournamentsData}
        seasons={seasons}
      />
    </>
  );
}

export default Page;
