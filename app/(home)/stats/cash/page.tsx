import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React from "react";
import CashGameTable from "@/components/cashgames/cashgame-table";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import StatsOverview from "@/components/cashgames/overview";
import OverviewMobile from "@/components/cashgames/overview-mobile";
import StatsTable from "@/components/cashgames/stats-table";

interface Props {
  searchParams: Promise<{
    year: string;
  }>;
}

async function Page({ searchParams }: Props) {
  const db = await createClient();

  const { year } = await searchParams;
  const yearNumber = Number(year);
  const [
    { data: seasons, error: seasonError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*").order("first_name", { ascending: true }),
  ]);
  if (seasonError)
    return <p>Error fetching Season data: {seasonError.message}</p>;

  if (membersError)
    return <p>Error fetching Member data: {membersError.message}</p>;

  const activeSeason = seasons.find((season) => season.year === yearNumber);
  const { data: seasonStats, error: seasonStatsError } = await db.rpc(
    "get_season_stats",
    {
      target_season_id: activeSeason.id,
    }
  );
  if (seasonStatsError)
    return <p>Error fetching Season data: {seasonStatsError.message}</p>;

  return (
    <>
      <PageHeader>
        <Select>
          <SelectTrigger className="border-none bg-transparent mx-auto h-fit p-0 flex items-center gap-1 text-xl font-bold w-fit">
            {activeSeason.year} Stats
            <ChevronDown className="w-6 h-6 ml-2" />
          </SelectTrigger>
          <SelectContent>
            <div key={activeSeason.id} className="flex w-full flex-col">
              {seasons.map((season) => (
                <Link
                  key={season.id + season.year}
                  className="w-full py-2 pl-2 pr-4"
                  href={`/stats/cash?year=${season.year}`}
                >
                  {season.year}
                </Link>
              ))}
            </div>
          </SelectContent>
        </Select>
      </PageHeader>
      <div className="animate-in">
        <StatsOverview seasonStats={seasonStats} />
        <OverviewMobile seasonStats={seasonStats} />
        <div className="pb-8 w-full">
          <StatsTable seasonStats={seasonStats} />
          <CashGameTable
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
