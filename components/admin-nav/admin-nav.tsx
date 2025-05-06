import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

async function AdminNav() {
  const db = await createClient();
  const { data: seasons, error: seasonsError } = await db
    .from("season")
    .select("*");

  if (seasonsError) {
    return <p>Error fetching Seasons: {seasonsError.message}</p>;
  }
  return (
    <div className="w-screen flex justify-center">
      <ul className="flex gap-12">
        <li className="flex flex-col">
          <Link
            className="whitespace-nowrap text-white pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/stats/cash">
            Cash
          </Link>
          <ul>
            {seasons.map((season) => (
              <li key={season.id}>
                <Link
                  className="text-white"
                  href={`/admin/stats/cash/${season.id}/sessions`}>
                  {season.year}
                </Link>
              </li>
            ))}
          </ul>
          <ul>
            <li>
              <Link
                className="whitespace-nowrap text-white p-1"
                href="/admin/stats/cash/new">
                Add Sessions
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link
            className="whitespace-nowrap text-white pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/stats/tournaments">
            Tournaments
          </Link>
        </li>
        <li>
          <Link
            className="whitespace-nowrap text-white pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/members">
            Members
          </Link>
        </li>
        <li>
          <Link
            className="whitespace-nowrap text-white pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/records">
            Records
          </Link>
        </li>
        <li>
          <Link
            className="whitespace-nowrap text-white pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/seasons">
            Seasons
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default AdminNav;
