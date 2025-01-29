import CashGameTable from "@/components/cashgames/cashgame-table";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Params {
  params: Promise<{ seasonId: string }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const { seasonId } = await params;
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("id", seasonId);

  if (seasonError) {
    return <p>Error fetching Season: {seasonError.message}</p>;
  }

  const { data: members, error: memberError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (memberError) {
    return <p>Error fetching Members: {memberError.message}</p>;
  }

  return (
    <>
      <h2>{season[0].year} Sessions</h2>
      <CashGameTable
        isAdmin={true}
        seasonId={seasonId}
        year={season[0].year}
        members={members}
      />
    </>
  );
}

export default Page;
