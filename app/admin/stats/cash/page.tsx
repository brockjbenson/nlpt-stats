import AdminCashCarousel from "@/components/admin/stats/cash/cash-nav";
import CashGameTable from "@/components/cashgames/cashgame-table";
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
    return <p>Error fetching Season: {seasonError.message}</p>;
  }

  if (membersError) {
    return <p>Error fetching Members: {membersError.message}</p>;
  }

  const year =
    params && params.year
      ? season.find((s) => s.year === parseInt(params.year))
      : season.find((s) => s.year === currentYear);

  return (
    <>
      <AdminCashCarousel
        seasons={season}
        year={year.year.toString()}
        isAdmin={true}
      />
      <div className="flex items-center px-2 mb-4 justify-between">
        <h2>Cash Games</h2>
        <div className="flex items-center gap-4">
          <Link
            className="bg-primary text-background border border-primary font-semibold text-sm flex items-center justify-center hover:bg-primary-hover px-4 py-2 rounded"
            href="/admin/stats/cash/new">
            Add Sessions
          </Link>
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
