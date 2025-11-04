import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import React from "react";
import StatsOverview from "@/components/cashgames/overview";
import OverviewMobile from "@/components/cashgames/overview-mobile";
import StatsTable from "@/components/cashgames/stats-table";
import ErrorHandler from "@/components/error-handler";
import CashYearSelector from "@/components/cashgames/cash-year-selector";
import dynamic from "next/dynamic";
import { Member, POYData, Season, SeasonCashStats } from "@/utils/types";
const LazyCashGameTable = dynamic(
  () => import("@/components/cashgames/cashgame-table")
);

interface Props {
  searchParams: Promise<{
    year: string;
  }>;
}

async function Page({ searchParams }: Props) {
  const db = await createClient();
  const currentYear = new Date().getFullYear();
  const { year } = await searchParams;
  const yearNumber = year ? Number(year) : currentYear;
  const { data, error } = await db.rpc("get_seasons_and_members");

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching data"
        errorMessage={error.message}
        pageTitle="Cash Stats"
      />
    );
  }

  const seasons: Season[] = data.seasons;
  const members: Member[] = data.members;

  const activeSeason =
    seasons.find(({ year }) => year === yearNumber) || seasons[0];

  const [seasonStatsResponse, poyDataResponse] = await Promise.all([
    db.rpc("get_season_stats", { target_season_id: activeSeason.id }),
    db.rpc("get_poy_info", { current_season_id: activeSeason.id }),
  ]);

  if (seasonStatsResponse.error || poyDataResponse.error) {
    return (
      <ErrorHandler
        title="Error fetching season stats"
        errorMessage={
          seasonStatsResponse.error?.message ||
          poyDataResponse.error?.message ||
          "Unknown error"
        }
        pageTitle="Cash Stats"
      />
    );
  }

  const seasonStats: SeasonCashStats[] = seasonStatsResponse.data;
  const poyData: POYData[] = poyDataResponse.data;

  return (
    <>
      <PageHeader>
        <CashYearSelector seasons={seasons} activeSeason={activeSeason} />
      </PageHeader>
      <div className="">
        <div className="hidden md:flex items-center px-2 mt-8 mb-2 justify-between">
          <h1 className="text-2xl font-semibold">
            {activeSeason.year} Cash Stats
          </h1>
          <CashYearSelector
            triggerTitle={activeSeason.year.toString()}
            triggerStyles="border-b border-b-neutral-500 py-3 w-24 m-0 rounded-none"
            activeSeason={activeSeason}
            seasons={seasons}
          />
        </div>
        <StatsOverview
          members={members}
          poyData={poyData}
          seasonStats={seasonStats}
        />
        <OverviewMobile
          members={members}
          poyData={poyData}
          seasonStats={seasonStats}
        />
        <div className="pb-4 w-full">
          <StatsTable seasonStats={seasonStats} />
          <LazyCashGameTable
            members={members}
            year={activeSeason.year}
            seasonId={activeSeason.id}
          />
        </div>
      </div>
    </>
  );
}

export default Page;
