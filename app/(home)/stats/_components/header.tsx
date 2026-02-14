import PageHeader from "@/components/page-header/page-header";
import {
  HeaderSelector,
  HeaderSelectorContent,
  HeaderSelectorItem,
  HeaderSelectorTrigger,
} from "@/components/page-header/year-selector";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface StatsHeaderProps {
  triggerLabel: string;
  view: "cumulative" | "cash" | "tournament";
  isCareer: boolean;
  year: string;
}

function StatsHeader({ triggerLabel, view, isCareer, year }: StatsHeaderProps) {
  return (
    <PageHeader className="pb-0">
      <HeaderSelector>
        <HeaderSelectorTrigger>
          {triggerLabel === "career" ? "Career" : triggerLabel} Stats
          <ChevronDown className="ml-1 size-4" />
        </HeaderSelectorTrigger>
        <HeaderSelectorContent>
          <HeaderSelectorItem href={`/stats/${view}/career`} active={isCareer}>
            Career Stats
          </HeaderSelectorItem>
          <Suspense>
            <YearSelectContent year={year} view={view} />
          </Suspense>
        </HeaderSelectorContent>
      </HeaderSelector>

      <Suspense>
        <ViewSelector currentYear={year} currentView={view} />
      </Suspense>
    </PageHeader>
  );
}

async function YearSelectContent({
  year,
  view,
}: {
  year: string;
  view: string;
}) {
  const db = await createClient();
  const { data: seasons, error: seasonsError } = await db
    .from("season")
    .select("*");

  if (seasonsError) {
    throw new Error(`Error fetching seasons: ${seasonsError.message}`);
  }
  return (
    <>
      {seasons
        .sort((a, b) => b.year - a.year)
        .map((season) => (
          <HeaderSelectorItem
            key={season.id}
            active={season.year.toString() === year}
            href={`/stats/${view}/${season.year}`}>
            {season.year} Stats
          </HeaderSelectorItem>
        ))}
    </>
  );
}

function ViewSelector({
  currentView,
  currentYear,
}: {
  currentView: string;
  currentYear: string | number;
}) {
  return (
    <div className="col-start-1 pb-1 row-start-2 col-span-3 w-full">
      <ul className="w-full flex items-center justify-start">
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-1.75 px-2",
              currentView === "cumulative" && "text-primary after:bg-primary",
            )}
            href={`/stats/cumulative/${currentYear}`}>
            Cumulative
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-1.75 px-2",
              currentView === "cash" && "text-primary after:bg-primary",
            )}
            href={`/stats/cash/${currentYear}`}>
            Cash
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-1.75 px-2",
              currentView === "tournament" && "text-primary after:bg-primary",
            )}
            href={`/stats/tournament/${currentYear}`}>
            Tournament
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default StatsHeader;
