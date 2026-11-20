import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import { getSeasons } from "@/lib/data/league";
import { ChevronDown } from "lucide-react";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import SeasonTabs, {
  SeasonTabsSkeleton,
} from "@/components/page-header/season-tabs";

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
    <>
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
      <DesktopPageHeader title="Tournaments">
        <Suspense fallback={<SeasonTabsSkeleton />}>
          <SeasonTabs
            leading={{ href: "/tournaments", label: "All", active: isCareer }}
            activeYear={isCareer ? "" : year}
            hrefFor={(seasonYear) => `/tournaments/${seasonYear}`}
          />
        </Suspense>
      </DesktopPageHeader>
    </>
  );
}

async function YearSelectContent({ year }: { year: string }) {
  const { data: seasons, error: seasonsError } = await getSeasons();

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
            href={`/tournaments/${season.year}`}
          >
            {season.year} Tournaments
          </YearSelectorItem>
        ))}
    </>
  );
}

export default TournamentsHeader;
