import CashGameTable from "@/components/cashgames/cashgame-table";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

interface Params {
  season?: string;
}

async function CashGames(props: { searchParams: Promise<Params | null> }) {
  const searchParams = await props.searchParams;
  const db = await createClient();
  const { data: members, error: membersError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", Number(searchParams?.season) || 2025);

  if (seasonError) {
    return <p>Error fetching Season: {seasonError.message}</p>;
  }

  if (membersError) {
    return <p>Error fetching Members: {membersError.message}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2>Cash Games</h2>
        <div className="flex items-center gap-4">
          <Link
            className="bg-primary text-background border border-primary font-semibold text-sm flex items-center justify-center hover:bg-primary-hover px-4 py-2 rounded"
            href="/admin/stats/cashgames/new">
            Add Sessions
          </Link>
        </div>
      </div>
      <CashGameTable
        isAdmin={true}
        seasonId={season[0].id}
        year={season[0].year}
        members={members}
      />
    </>
  );
}

export default CashGames;
