import { createClient } from "@/utils/supabase/server";
import { getCumulativeCashStats } from "@/utils/utils";
import React, { Suspense } from "react";
import StatsTable from "./_components/stats-table";
import CashGameTable from "@/components/cashgames/cashgame-table";
import StatsOverview from "./_components/overview";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { SelectIcon, SelectTrigger } from "@radix-ui/react-select";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import StatsLoading from "./loading";
import { BackButton } from "@/components/ui/back-button";
import PageHeader from "@/components/page-header/page-header";

interface Params {
  params: Promise<{ year: number }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const year = await params;
  const { data: seasons, error: seasonError } = await db
    .from("season")
    .select("*");

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }
  const currentYear = seasons.filter(
    (season) => season.year === Number(year.year)
  );

  const { data: members, error: memberError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*), week:week_id(*)`)
    .eq("season_id", currentYear[0].id);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  const sessionSortedByWeek = sessions.sort(
    (a, b) => a.week.week_number - b.week.week_number
  );

  const cumulativeCashStats = getCumulativeCashStats(
    sessionSortedByWeek,
    memberIds,
    members
  );

  return (
    <>
      {/* <StatsLoading /> */}
      <Suspense fallback={<StatsLoading />}>
        <PageHeader className="m-0">
          <Select>
            <SelectTrigger className="border-none flex items-center gap-1 text-2xl font-bold w-fit">
              {currentYear[0].year} Stats
              <ChevronDown className="w-6 h-6 ml-2" />
            </SelectTrigger>
            <SelectContent>
              <div key={currentYear[0].id} className="flex w-full flex-col">
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
        <div className="px-2 pb-8 w-full">
          <StatsTable cumulativeCashStats={cumulativeCashStats} />
          <CashGameTable
            members={members}
            year={currentYear[0].year}
            seasonId={currentYear[0].id}
          />
        </div>
      </Suspense>
    </>
  );
}

export default Page;
