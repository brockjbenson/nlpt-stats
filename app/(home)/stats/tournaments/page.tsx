import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import React from "react";
import ErrorHandler from "@/components/error-handler";
import TournamentsMain from "@/components/stats/tournament/tournaments-main";

async function Page() {
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
    { target_season_year: null } // Ensure it is null if not set
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
      <TournamentsMain tournamentsData={tournamentsData} seasons={seasons} />
    </>
  );
}

export default Page;
