import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import { createClient } from "@/utils/supabase/server";
import { ChevronDown } from "lucide-react";

import { Suspense } from "react";

interface TournamentsHeaderProps {
  triggerLabel: string;
  isCareer: boolean;
  year: string;
}

function TournamentsHeader({
  triggerLabel,
  isCareer,
  year,
}: TournamentsHeaderProps) {
  return (
    <PageHeader>
      <YearSelector>
        <YearSelectorTrigger>
          {triggerLabel === "all" ? "All" : triggerLabel} Tournaments
          <ChevronDown className="ml-1 size-4" />
        </YearSelectorTrigger>
        <YearSelectorContent>
          <YearSelectorItem href={`/tournaments`} active={isCareer}>
            All Tournaments
          </YearSelectorItem>
          <Suspense>
            <YearSelectContent year={year} />
          </Suspense>
        </YearSelectorContent>
      </YearSelector>
    </PageHeader>
  );
}

async function YearSelectContent({ year }: { year: string }) {
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
          <YearSelectorItem
            key={season.id}
            active={season.year.toString() === year}
            href={`/tournaments/${season.year}`}>
            {season.year} Tournaments
          </YearSelectorItem>
        ))}
    </>
  );
}

export default TournamentsHeader;
