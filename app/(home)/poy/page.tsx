import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import POYInfo from "@/components/poy/poy-info";
import YearCarousel from "@/components/poy/year-carousel";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { POYDataTable } from "./table/table";
import { columns } from "./table/columns";

interface Params {
  searchParams: Promise<{ year: string | null }>;
}

async function Page({ searchParams }: Params) {
  const { year } = await searchParams;
  const currentYear = year ? year : new Date().getFullYear();
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

  const activeSeason = seasons.find(
    (season) => season.year === Number(currentYear)
  );

  const { data: poyData, error: poyError } = await db.rpc("get_poy_info", {
    current_season_id: activeSeason.id,
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
        <POYInfo />
      </PageHeader>
      <YearCarousel seasons={seasons} year={year || currentYear.toString()} />
      <div className="w-full  mt-4 mb-8 max-w-screen-xl mx-auto px-2">
        <Card className="w-full">
          <POYDataTable columns={columns} data={poyData} />
        </Card>
      </div>
    </>
  );
}

export default Page;
