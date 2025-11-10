import AdminCashCarousel from "@/components/admin/stats/cash/cash-nav";
import CashYearSelector from "@/components/stats/cash/cash-year-selector";
import CashGameTable from "@/components/stats/cash/cashgame-table";
import ErrorHandler from "@/components/error-handler";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

interface Props {
  searchParams: Promise<{ year: string } | null>;
}

async function CashGames({ searchParams }: Props) {
  const params = await searchParams;
  const db = await createClient();
  const currentYear = new Date().getFullYear();
  const [
    { data: members, error: membersError },
    { data: season, error: seasonError },
  ] = await Promise.all([
    db.from("members").select("*").order("first_name", { ascending: true }),
    db.from("season").select("*").order("year", { ascending: false }),
  ]);

  if (seasonError) {
    return (
      <ErrorHandler
        title="Error fetching season stats"
        errorMessage={seasonError?.message || "Unknown error"}
        pageTitle="Cash Stats"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching season stats"
        errorMessage={membersError?.message || "Unknown error"}
        pageTitle="Cash Stats"
      />
    );
  }

  const year =
    params && params.year
      ? season.find((s) => s.year === parseInt(params.year))
      : season.find((s) => s.year === currentYear);

  const activeSeason = season.find((s) => s.year === year?.year) || season[0];

  return (
    <>
      <AdminCashCarousel
        seasons={season}
        year={year.year.toString()}
        isAdmin={true}
      />
      <div className="flex items-center px-2 md:mt-8 mb-4 justify-between">
        <h2>Cash Games</h2>

        <div className="flex items-center gap-4">
          <CashYearSelector
            isAdmin
            triggerTitle={year.year.toString()}
            triggerStyles="border-b border-b-neutral-500 hidden md:flex py-3 w-24 m-0 rounded-none"
            activeSeason={activeSeason}
            seasons={season}
          />
          <div className="flex items-center gap-4">
            <Link
              className="bg-primary text-background border border-primary font-semibold text-sm flex items-center justify-center hover:bg-primary-hover px-4 py-2 rounded"
              href="/admin/stats/cash/new">
              Add Sessions
            </Link>
          </div>
        </div>
      </div>
      <CashGameTable
        isAdmin={true}
        seasonId={year.id}
        year={year.year}
        members={members}
      />
    </>
  );
}

export default CashGames;
