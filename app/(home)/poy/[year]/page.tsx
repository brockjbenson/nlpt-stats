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
import { columns } from "@/features/poy/components/table/columns";
import { POYDataTable } from "@/features/poy/components/table/table";
import POYInfo from "@/features/poy/components/poy-info";
import { createClient } from "@/utils/supabase/server";

interface Params {
  params: Promise<{ year: string }>;
}

async function Page({ params }: Params) {
  const { year } = await params;
  const currentYear = Number(year);

  // Use service role client for static generation
  const db = await createClient();

  const [{ data: seasons, error: seasonError }] = await Promise.all([
    db.from("season").select("*"),
  ]);

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

  const { data: poyData, error: poyError } = await db.rpc("get_poy_info", {
    current_season_id: activeSeason.id,
    target_member_id: null,
  });

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
                  href={`/poy/${season.year}`}>
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
            <CardHeader>
              <CardTitle>
                Player of the Year Standings - {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <POYDataTable columns={columns} data={poyData} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default Page;
