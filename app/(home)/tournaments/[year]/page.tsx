import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import TournamentsMain from "@/features/tournaments/components/tournaments-main";
import { createStaticClient } from "@/utils/supabase/static";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-static";

interface Props {
  params: Promise<{ year: string }>;
}

export async function generateStaticParams() {
  const db = createStaticClient();
  const { data: seasons } = await db.from("season").select("year");

  if (!seasons) {
    return [];
  }
  return seasons.map((season) => ({ year: season.year.toString() }));
}

async function page({ params }: Props) {
  const db = createStaticClient();
  const { year } = await params;
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
  const activeSeason = seasons.find(
    (season) => season.year.toString() === year
  );
  const seasonId = activeSeason
    ? activeSeason.id.toString()
    : seasons[0].id.toString();

  const { data: tournaments, error: tournamentsError } = await db
    .from("tournaments")
    .select("*, tournament_sessions(*), season(year)")
    .eq("season_id", seasonId);

  if (tournamentsError) {
    return (
      <ErrorHandler
        title="Error fetching tournaments"
        errorMessage={tournamentsError.message}
        pageTitle="Tournaments"
      />
    );
  }

  return (
    <>
      <PageHeader>
        <YearSelector>
          <YearSelectorTrigger className="font-bold text-xl">
            {year} Tournaments
            <ChevronDown className="inline-block ml-2 mb-1" size={16} />
          </YearSelectorTrigger>
          <YearSelectorContent>
            <YearSelectorItem href={`/tournaments`} active={false}>
              All Tournaments
            </YearSelectorItem>
            {seasons
              .sort((a, b) => b.year - a.year)
              .map((season) => (
                <YearSelectorItem
                  key={season.id}
                  active={season.year === Number(year)}
                  href={`/tournaments/${season.year}`}>
                  {season.year} Tournaments
                </YearSelectorItem>
              ))}
          </YearSelectorContent>
        </YearSelector>
      </PageHeader>
      <TournamentsMain members={members} tournamentsData={tournaments} />
    </>
  );
}

export default page;
