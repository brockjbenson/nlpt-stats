import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Params {
  params: Promise<{ year: number }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const year = await params;
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year.year);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }
  return (
    <>
      <h1>{season[0].year} Stats</h1>
    </>
  );
}

export default Page;
