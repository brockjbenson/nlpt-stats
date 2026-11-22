import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import React from "react";
import NewTournamentForm from "./_components/newTournamentForm";

const TITLE = "New Tournament";

async function Page() {
  const db = await createClient();
  const [
    { data: seasons, error: seasonError },
    { data: weeks, error: weekError },
  ] = await Promise.all([
    db.from("season").select("*").order("year", { ascending: false }),
    db.from("week").select("*").order("week_number", { ascending: false }),
  ]);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  if (weekError) {
    return <p>Error fetching Week data: {weekError.message}</p>;
  }
  return (
    <>
      <PageHeader title={TITLE} showBackButton />
      <DesktopPageHeader title={TITLE} />
      <NewTournamentForm seasons={seasons} weeks={weeks} />
    </>
  );
}

export default Page;
