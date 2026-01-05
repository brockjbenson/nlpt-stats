import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import POYInfo from "@/components/poy/poy-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { POYDataTable } from "./table/table";
import { columns } from "./table/columns";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AlertCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

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
        <div className="flex items-center justify-center gap-2">
          <POYInfo />
          <DropdownMenu>
            <DropdownMenuTrigger className="text-xl font-bold">
              {currentYear} POY
              <ChevronDown className="ml-1 inline-block size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {seasons.map((season) => (
                  <DropdownMenuItem asChild key={season.id}>
                    <Link href={`/poy?year=${season.year}`} className="w-full">
                      {season.year}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>
      <div className="w-full  mt-4 mb-8 max-w-(--breakpoint-xl) mx-auto px-2">
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
