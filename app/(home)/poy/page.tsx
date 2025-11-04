import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import POYInfo from "@/components/poy/poy-info";
import YearCarousel from "@/components/poy/year-carousel";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import React from "react";
import POYTable from "./components/poy-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
        <POYInfo />
      </PageHeader>
      <YearCarousel seasons={seasons} year={year || currentYear.toString()} />
      <div className="w-full  mt-4 mb-8 max-w-screen-xl mx-auto px-2">
        <Card className="w-full">
          <div className="w-full flex py-2 items-center justify-between">
            <CardTitle className="p-0">Player of the Year Standings</CardTitle>
            <Select>
              <SelectTrigger className="bg-card max-md:hidden md:text-base text-sm border border-neutral-600 px-2 w-fit">
                {year || currentYear}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="flex w-full flex-col">
                  {seasons.map((season) => (
                    <Link
                      key={season.id + season.year}
                      className="w-full py-2 pl-2 pr-4 hover:bg-neutral-800"
                      href={`/poy?year=${season.year}`}>
                      {season.year}
                    </Link>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <POYTable data={poyData || []} />
        </Card>
      </div>
    </>
  );
}

export default Page;
