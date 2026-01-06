import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import StatCards from "@/features/stats/components/cards";
import { columns } from "@/features/stats/components/table/columns";
import { StatsTable } from "@/features/stats/components/table/table";
import ViewSelector from "@/features/stats/view-selector";
import { createClient } from "@/utils/supabase/server";
import { AlertCircle, ChevronDown } from "lucide-react";

async function Stats({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    view?: "cumulative" | "cash" | "tournament";
  }>;
}) {
  const { year, view } = await searchParams;
  const currentView = view ? view : "cumulative";
  const currentYear = year ? year : new Date().getFullYear().toString();

  const db = await createClient();

  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*").order("year", { ascending: false }),
    db.from("members").select("*"),
  ]);

  if (seasonsError) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={seasonsError.message}
        pageTitle="Stats"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Stats"
      />
    );
  }

  // Determine if we're in career mode or a specific season
  const isCareerMode = currentYear === "career";

  // Find the active season (only needed for non-career mode)
  const activeSeason = isCareerMode
    ? null
    : seasons.find((season) => season.year.toString() === currentYear) ||
      seasons[0];

  // Get the display year
  const displayYear = isCareerMode
    ? "Career"
    : activeSeason?.year || currentYear;

  // Get the target_season parameter for the RPC call
  const targetSeason = isCareerMode ? "career" : activeSeason?.id.toString();

  if (!isCareerMode && !activeSeason) {
    return (
      <ErrorHandler
        title="No Active Season"
        errorMessage="No active season found for the selected year."
        pageTitle="Stats"
      />
    );
  }

  const [careerStatsResponse] = await Promise.all([
    db.rpc("get_career_stats", {
      target_view: currentView,
      target_season: targetSeason, // ✅ Pass "career" or season_id as string
    }),
  ]);

  if (careerStatsResponse.error) {
    return (
      <ErrorHandler
        pageTitle="Career Stats"
        title={"Error Loading Career Stats"}
        errorMessage={careerStatsResponse.error.message || "Unknown error"}
      />
    );
  }
  const careerStats = careerStatsResponse.data;

  return (
    <>
      <PageHeader className="pb-0">
        <YearSelector>
          <YearSelectorTrigger>
            {displayYear} Stats <ChevronDown className="ml-1 size-4" />
          </YearSelectorTrigger>
          <YearSelectorContent>
            <YearSelectorItem
              href={`/stats?year=career&view=${currentView}`}
              active={isCareerMode}>
              Career Stats
            </YearSelectorItem>
            {seasons.map((season) => (
              <YearSelectorItem
                key={season.id}
                active={!isCareerMode && season.id === activeSeason?.id}
                href={`/stats?year=${season.year}&view=${currentView}`}>
                {season.year} Stats
              </YearSelectorItem>
            ))}
          </YearSelectorContent>
        </YearSelector>
        <ViewSelector
          currentYear={currentYear}
          currentView={currentView}
          activeSeason={activeSeason}
        />
      </PageHeader>
      {careerStats.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>
              No {currentView.charAt(0).toUpperCase() + currentView.slice(1)}{" "}
              Stats Available for {displayYear}
            </EmptyTitle>
            <EmptyDescription>
              No{" "}
              {currentView === "cumulative"
                ? "cash or tournament"
                : currentView}{" "}
              data has been added for {displayYear}. Once{" "}
              {currentView === "cumulative"
                ? "cash or tournament"
                : currentView}{" "}
              data is added, it will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <StatCards members={members} data={careerStats} />
          <StatsTable
            year={displayYear}
            view={currentView}
            columns={columns}
            data={careerStats}
          />
        </>
      )}
    </>
  );
}

export default Stats;
