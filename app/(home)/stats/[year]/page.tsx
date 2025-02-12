import { createClient } from "@/utils/supabase/server";
import { getCumulativeCashStats } from "@/utils/utils";
import React from "react";
import StatsTable from "./_components/stats-table";
import CashGameTable from "@/components/cashgames/cashgame-table";
import StatsOverview from "./_components/overview";
import { Select, SelectContent } from "@/components/ui/select";
import { SelectTrigger } from "@radix-ui/react-select";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import PageHeader from "@/components/page-header/page-header";
import OverviewMobile from "./_components/overview-mobile";

interface Params {
  params: Promise<{ year: number }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const { year } = await params;

  const [
    { data: seasons, error: seasonError },
    { data: members, error: memberError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*").order("first_name", { ascending: true }),
  ]);

  if (seasonError)
    return <p>Error fetching Season data: {seasonError.message}</p>;
  if (memberError)
    return <p>Error fetching Member data: {memberError.message}</p>;

  const currentSeason = seasons.find((season) => season.year === Number(year));

  if (!currentSeason) return <p>No season found for {year}</p>;

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(
      `
      *,
      member:member_id(id, first_name),
      week:week_id(week_number)
    `
    )
    .eq("season_id", currentSeason.id);

  if (sessionError)
    return <p>Error fetching Session data: {sessionError.message}</p>;

  const sessionSortedByWeek = [...sessions].sort(
    (a, b) => a.week.week_number - b.week.week_number
  );

  const memberIds = members.map((member) => member.id);

  const cumulativeCashStats = getCumulativeCashStats(
    sessionSortedByWeek,
    memberIds,
    members
  );

  return (
    <>
      <PageHeader>
        <Select>
          <SelectTrigger className="border-none mx-auto flex items-center gap-1 text-2xl font-bold w-fit">
            {currentSeason.year} Stats
            <ChevronDown className="w-6 h-6 ml-2" />
          </SelectTrigger>
          <SelectContent>
            <div key={currentSeason.id} className="flex w-full flex-col">
              {seasons.map((season) => (
                <Link
                  key={season.id + season.year}
                  className="w-full py-2 pl-2 pr-4"
                  href={`/stats/${season.year}`}>
                  {season.year}
                </Link>
              ))}
            </div>
          </SelectContent>
        </Select>
      </PageHeader>
      <StatsOverview
        members={members}
        memberIds={memberIds}
        sessions={sessions}
      />
      <OverviewMobile
        members={members}
        sessions={sessions}
        memberIds={memberIds}
      />
      <div className="px-2 pb-8 w-full">
        <StatsTable cumulativeCashStats={cumulativeCashStats} />
        <CashGameTable
          members={members}
          year={currentSeason.year}
          seasonId={currentSeason.id}
        />
      </div>
    </>
  );
}

export default Page;
