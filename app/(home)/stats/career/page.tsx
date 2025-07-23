import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import CareerOverview from "@/components/stats/career/career-leaders";
import StatsTable from "@/components/stats/career/stats-table";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { Member } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view: string }>;
}) {
  const view = (await searchParams).view || "all";
  const db = await createClient();
  const [careerStatsResponse] = await Promise.all([
    db.rpc("get_career_stats", { target_view: view }),
  ]);

  if (careerStatsResponse.error) {
    return (
      <ErrorHandler
        pageTitle="Career Stats"
        title={"Error Loading Career Stats"}
        errorMessage={careerStatsResponse.error.message || "Unknown error"}
      />
    );
  }
  const careerStats = careerStatsResponse.data;

  return (
    <>
      <PageHeader title="Career Stats" />
      <ul className="w-full grid grid-cols-3 gap-4 px-3 pb-4 mb-4 border-b border-neutral-500">
        <li className="w-full flex items-center justify-center">
          <Link
            className={cn(
              "w-full py-2 flex items-center justify-center rounded",
              view === "all" && "bg-primary text-white font-semibold"
            )}
            href={`/stats/career?view=all`}>
            All Stats
          </Link>
        </li>
        <li className="w-full flex items-center justify-center">
          <Link
            className={cn(
              "w-full py-2 flex items-center justify-center rounded",
              view === "cash" && "bg-primary text-white font-semibold"
            )}
            href={`/stats/career?view=cash`}>
            Cash Stats
          </Link>
        </li>
        <li className="w-full flex items-center justify-center">
          <Link
            className={cn(
              "w-full py-2 flex items-center justify-center rounded",
              view === "tournament" && "bg-primary text-white font-semibold"
            )}
            href={`/stats/career?view=tournament`}>
            Tourney Stats
          </Link>
        </li>
      </ul>
      <CareerOverview careerStats={careerStats} />
      <StatsTable careerStats={careerStats} view={view} />
    </>
  );
}

export default Page;
