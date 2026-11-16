import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AlertCircle } from "lucide-react";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import POYInfo from "@/features/poy/components/poy-info";
import POYRankings from "@/features/poy/components/poy-rankings";
import { getMembers, getPoyInfo, getSeasons } from "@/lib/data/league";
import { seasonYearParams } from "@/lib/data/static-params";

interface Params {
  params: Promise<{ year: string }>;
}

async function Page({ params }: Params) {
  const { year } = await params;
  const currentYear = Number(year);

  const { data: seasons, error: seasonError } = await getSeasons();

  if (seasonError)
    return (
      <ErrorHandler
        errorMessage={seasonError.message}
        title="Error fetching seasons"
        pageTitle="POY Standings"
      />
    );

  const activeSeason = seasons.find((season) => season.year === currentYear);

  if (!activeSeason) {
    return (
      <ErrorHandler
        errorMessage="Season not found"
        title="Invalid Year"
        pageTitle="POY Standings"
      />
    );
  }

  const [{ data: poyData, error: poyError }, { data: members }] =
    await Promise.all([getPoyInfo(activeSeason.id, null), getMembers()]);

  // Portraits are optional; cards fall back to a placeholder if missing
  const portraits: Record<string, string | null> = Object.fromEntries(
    (members ?? []).map((m: { id: string; portrait_url: string | null }) => [
      m.id,
      m.portrait_url,
    ]),
  );

  if (poyError) {
    return (
      <ErrorHandler
        errorMessage={poyError.message}
        title="Error fetching POY Data"
        pageTitle="POY Standings"
      />
    );
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center relative w-fit mx-auto justify-center ">
          <POYInfo />
          <YearSelector>
            <YearSelectorTrigger className="font-bold text-xl">
              {activeSeason.year} POY
            </YearSelectorTrigger>
            <YearSelectorContent>
              {seasons.map((season) => (
                <YearSelectorItem
                  key={season.id}
                  active={season.year === activeSeason.year}
                  href={`/poy/${season.year}`}
                >
                  {season.year}
                </YearSelectorItem>
              ))}
            </YearSelectorContent>
          </YearSelector>
        </div>
      </PageHeader>
      <div className="w-full mb-8 max-w-(--breakpoint-xl) mx-auto px-2">
        {poyData.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>No POY Available</EmptyTitle>
              <EmptyDescription>
                Once Tournament/Cash Session data is available for {currentYear}
                , POY points will be calculated and displayed here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card className="w-full">
            {/* Mobile already shows "{year} POY" in the page header */}
            <CardHeader className="max-md:hidden">
              <CardTitle>
                Player of the Year Standings - {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <POYRankings data={poyData} portraits={portraits} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

// Prebuilt with data at deploy time; see lib/data/static-params.ts.
export const generateStaticParams = seasonYearParams;

export default Page;
