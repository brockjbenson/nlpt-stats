import { createClient } from "@/utils/supabase/server";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  year: string;
}

async function Season({ year }: Props) {
  const db = await createClient();
  const { data: season, error } = await db
    .from("season")
    .select("*")
    .eq("year", Number(year));

  if (error) {
    return <p>Error fetching Season: {error.message}</p>;
  }

  const { data: weeks, error: weeksError } = await db
    .from("week")
    .select("*")
    .eq("seasonId", season[0].id);
  return (
    <>
      <Link
        className="flex items-center mb-4 gap-2 hover:text-primary"
        href="/admin/seasons">
        <ArrowLeftIcon className="w-4 h-4" />
        All Seasons
      </Link>
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-2xl font-semibold">
          {season[0].year} Season
        </h2>
        <Link
          className="bg-primary text-white font-medium px-4 py-2 rounded hover:bg-primary-dark"
          href={`/admin/seasons?year=${season[0].year}&newweek=${season[0].id}`}>
          Add Weeks
        </Link>
      </div>
      <div className="mt-8">
        {weeksError ? (
          <p className="text-red-500 mt-16 text-center">
            {weeksError.message} fetching weeks for {season[0].year} season
          </p>
        ) : weeks.length === 0 ? (
          <p className="text-muted text-center mt-16">
            No week data for {season[0].year} season
          </p>
        ) : (
          <ul className="grid grid-cols-8 gap-x-4">
            {weeks.map((week) => (
              <li className="py-2 border-b border-muted" key={week.id}>
                <Link
                  href={`/admin/seasons?year=${season[0].year}&week=${week.id}`}>
                  Week {week.weekNumber}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default Season;
