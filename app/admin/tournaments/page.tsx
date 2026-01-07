import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import TournamentsMain from "@/features/tournaments/components/tournaments-main";
import { createStaticClient } from "@/utils/supabase/static";
import React from "react";

async function page() {
  const db = createStaticClient();
  const [
    { data: tournaments, error: tournamentsError },
    { data: members, error: membersError },
    { data: seasons, error: seasonsError },
  ] = await Promise.all([
    db.from("tournaments, tournament_sessions(*), season(year)").select("*"),
    db.from("members").select("*"),
    db.from("season").select("*"),
  ]);

  if (tournamentsError) {
    return (
      <ErrorHandler
        title="Error fetching Tournament data"
        errorMessage={tournamentsError.message}
        pageTitle="Tournament"
      />
    );
  }
  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Tournament"
      />
    );
  }
  if (seasonsError) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={seasonsError.message}
        pageTitle="Tournament"
      />
    );
  }
  return (
    <>
      <PageHeader title={"Tournaments"} />
      <TournamentsMain members={members} tournamentsData={tournaments} />
    </>
  );
}

export default page;
