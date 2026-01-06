import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import ErrorHandler from "@/components/error-handler";

import { ChevronDown } from "lucide-react";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import TournamentsMain from "@/features/tournaments/components/tournaments-main";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const db = await createClient();
  const { year } = await searchParams;
  const currentYear = year ? year : new Date().getFullYear();
  const yearNumber = Number(currentYear);
  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*"),
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

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Tournaments"
      />
    );
  }

  const activeSeason =
    seasons.find((season) => season.year === yearNumber) || seasons[0];

  const { data: tournamentsData, error: tournamentsDataError } = await db
    .from("tournaments")
    .select("*, tournament_sessions(*)")
    .eq("season_id", activeSeason.id);

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
      <PageHeader>
        <YearSelector>
          <YearSelectorTrigger className="font-bold text-xl">
            {activeSeason.year} Tournaments
            <ChevronDown className="inline-block ml-2 mb-1" size={16} />
          </YearSelectorTrigger>
          <YearSelectorContent>
            {seasons.map((season) => (
              <YearSelectorItem
                key={season.id}
                active={season.year === activeSeason.year}
                href={`/tournaments?year=${season.year}`}>
                {season.year}
              </YearSelectorItem>
            ))}
          </YearSelectorContent>
        </YearSelector>
      </PageHeader>
      <TournamentsMain
        members={members}
        year={yearNumber}
        tournamentsData={tournamentsData}
      />
    </>
  );
}

export default Page;
