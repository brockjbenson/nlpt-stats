import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

async function Seasons() {
  const db = await createClient();
  const { data, error } = await db
    .from("season")
    .select(
      `
        *,
        week (
          weekNumber,
          seasonId
        )
      `
    )
    .order("year", { ascending: false });

  if (error) {
    return <p>Error fetching Seasons: {error.message}</p>;
  }

  return (
    <>
      <h1>Seasons</h1>
      <ul className="grid grid-cols-6 mt-8 gap-4">
        {data.map((season: any) => (
          <li className="w-full" key={season.id}>
            <Link
              className="w-full gap-2 p-4 flex h-full rounded border border-primary hover:bg-primary/15"
              href={`/admin/seasons?year=${season.year}`}>
              {season.year}
              <span className="text-muted">Weeks: {season.week.length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Seasons;
