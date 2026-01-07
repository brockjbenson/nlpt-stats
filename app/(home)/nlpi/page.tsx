import ErrorHandler from "@/components/error-handler";
import NLPICalculator from "@/features/nlpi/components/nlpi-calculator";
import NLPIInfo from "@/features/nlpi/components/nlpi-info";
import PageHeader from "@/components/page-header/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NLPIDataTable } from "@/features/nlpi/components/table/table";
import { columns } from "@/features/nlpi/components/table/columns";
import { NLPIData } from "@/features/nlpi/lib/types";
import { createClient } from "@/utils/supabase/server";

async function NLPI() {
  // Use service role client for static generation
  const db = await createClient();

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const { data: seasons, error: seasonError } = await db
    .from("season")
    .select("*");

  if (seasonError) {
    return (
      <ErrorHandler
        errorMessage={seasonError.message}
        title="Error fetching seasons"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const activeSeason = seasons.find((season) => season.year === currentYear);

  if (!activeSeason) {
    return (
      <ErrorHandler
        errorMessage="Current season not found"
        title="Error fetching season"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const { data: nlpiData, error: nlpiError } = await db.rpc("get_nlpi_info", {
    current_season_id: activeSeason.id,
  });

  if (nlpiError) {
    return (
      <ErrorHandler
        errorMessage={nlpiError.message}
        title="Error fetching NLPI data"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const ineligibleMembers = nlpiData.filter(
    (data: NLPIData) => data.total_points === 0
  );

  return (
    <>
      <PageHeader>
        <NLPIInfo />
      </PageHeader>
      <div className="w-full px-2 max-w-(--breakpoint-xl) mx-auto">
        <Card className="w-full mb-8">
          <CardHeader className="justify-between">
            <CardTitle>NLPI Rankings - {currentYear}</CardTitle>
            <NLPICalculator nlpiData={nlpiData} />
          </CardHeader>
          <CardContent>
            <NLPIDataTable
              columns={columns}
              data={nlpiData
                .map((row: NLPIData) => ({ ...row, previousYear }))
                .filter(
                  (row: NLPIData & { previousYear: number | null }) =>
                    row.total_points > 0
                )}
            />
          </CardContent>
        </Card>
        <h2 className="mt-12 mb-2 w-full flex flex-col gap-1 text-base pb-2 border-b border-muted mr-auto">
          Ineligible Members
          <span className="text-xs text-muted">
            (no data for most recent 20 cash sessions or last 4 tournaments)
          </span>
        </h2>
        {ineligibleMembers.length === 0 ? (
          <p className="mt-4">No members are ineligible for NLPI points.</p>
        ) : (
          ineligibleMembers.map((data: NLPIData) => {
            return (
              <div
                key={data.member_id}
                className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{data.first_name}</h3>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export default NLPI;
