import ErrorHandler from "@/components/error-handler";
import NLPICalculator from "@/components/nlpi/nlpi-calculator";
import NLPIInfo from "@/components/nlpi/nlpi-info";
import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { NLPIData } from "@/utils/types";
import { NLPIDataTable } from "./table/table";
import { columns } from "./table/columns";

async function NLPI() {
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
      <div className="w-full  px-2 mt-4 max-w-screen-xl mx-auto">
        <div className="my-4 grid grid-cols-2">
          <NLPICalculator nlpiData={nlpiData} />
        </div>
        <Card className="w-full mb-8">
          <NLPIDataTable
            columns={columns}
            data={nlpiData
              .map((row: NLPIData) => ({ ...row, previousYear }))
              .filter(
                (row: NLPIData & { previousYear: number | null }) =>
                  row.total_points > 0
              )}
          />
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
