import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import { getCumulativeCashStats } from "@/utils/utils";
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
    { data: members, error: memberError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*").order("first_name", { ascending: true }),
  ]);
  if (seasonError)
    return <p>Error fetching Season data: {seasonError.message}</p>;
  if (memberError)
    return <p>Error fetching Member data: {memberError.message}</p>;
  const activeSeason = seasons.find((season) => season.year === yearNumber);
  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(
      `
      *,
      member:member_id(id, first_name),
      week:week_id(week_number)
    `
    )
    .eq("season_id", activeSeason.id);

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
          <SelectTrigger className="border-none mx-auto h-fit p-0 flex items-center gap-1 text-xl font-bold w-fit">
            {activeSeason.year} Stats
            <ChevronDown className="w-6 h-6 ml-2" />
          </SelectTrigger>
          <SelectContent>
            <div key={activeSeason.id} className="flex w-full flex-col">
              {seasons.map((season) => (
                <Link
                  key={season.id + season.year}
                  className="w-full py-2 pl-2 pr-4"
                  href={`/stats/cash?year=${season.year}`}>
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
          year={activeSeason.year}
          seasonId={activeSeason.id}
        />
      </div>
    </>
  );
}

export default Page;
