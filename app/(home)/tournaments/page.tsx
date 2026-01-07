import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import TournamentsMain from "@/features/tournaments/components/tournaments-main";
import { createClient } from "@/utils/supabase/server";
import { ChevronDown } from "lucide-react";

async function page() {
  const db = await createClient();
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

  const { data: tournaments, error: tournamentsError } = await db
    .from("tournaments")
    .select("*, tournament_sessions(*), season(year)");

  if (tournamentsError) {
    return (
      <ErrorHandler
        title="Error fetching tournaments"
        errorMessage={tournamentsError.message}
        pageTitle="Tournaments"
      />
    );
  }

  const sortedTournaments = tournaments.sort((a, b) => {
    const dateA = a.date;
    const dateB = b.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <>
      <PageHeader>
        <YearSelector>
          <YearSelectorTrigger className="font-bold text-xl">
            All Tournaments
            <ChevronDown className="inline-block ml-2 mb-1" size={16} />
          </YearSelectorTrigger>
          <YearSelectorContent>
            <YearSelectorItem href={`/tournaments`} active={true}>
              All Tournaments
            </YearSelectorItem>
            {seasons
              .sort((a, b) => b.year - a.year)
              .map((season) => (
                <YearSelectorItem
                  key={season.id}
                  active={false}
                  href={`/tournaments/${season.year}`}>
                  {season.year} Tournaments
                </YearSelectorItem>
              ))}
          </YearSelectorContent>
        </YearSelector>
      </PageHeader>
      <TournamentsMain members={members} tournamentsData={sortedTournaments} />
    </>
  );
}

export default page;
