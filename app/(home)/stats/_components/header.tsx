import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import { getSeasons } from "@/lib/data/league";
import { ChevronDown } from "lucide-react";
import React, { Suspense } from "react";
import ViewSelector, { statsViewTabs } from "./view-selector";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import LinkTabs from "@/components/page-header/link-tabs";
import SeasonTabs, {
  SeasonTabsSkeleton,
} from "@/components/page-header/season-tabs";

interface StatsHeaderProps {
  triggerLabel: string;
  view: "cumulative" | "cash" | "tournament";
  isCareer: boolean;
  year: string;
}

function StatsHeader({ triggerLabel, view, isCareer, year }: StatsHeaderProps) {
  return (
    <>
      <PageHeader className="pb-0">
        <YearSelector>
          <YearSelectorTrigger>
            {triggerLabel === "career" ? "Career" : triggerLabel} Stats
            <ChevronDown className="ml-1 size-4" />
          </YearSelectorTrigger>
          <YearSelectorContent>
            <YearSelectorItem href={`/stats/${view}/career`} active={isCareer}>
              Career Stats
            </YearSelectorItem>
            <Suspense>
              <YearSelectContent year={year} view={view} />
            </Suspense>
          </YearSelectorContent>
        </YearSelector>

        <Suspense>
          <ViewSelector currentYear={year} currentView={view} />
        </Suspense>
      </PageHeader>
      <DesktopPageHeader title="Stats">
        <LinkTabs variant="chips" tabs={statsViewTabs(view, year)} />
        <Suspense fallback={<SeasonTabsSkeleton />}>
          <SeasonTabs
            leading={{
              href: `/stats/${view}/career`,
              label: "Career",
              active: isCareer,
            }}
            activeYear={isCareer ? "" : year}
            hrefFor={(seasonYear) => `/stats/${view}/${seasonYear}`}
          />
        </Suspense>
      </DesktopPageHeader>
    </>
  );
}

async function YearSelectContent({
  year,
  view,
}: {
  year: string;
  view: string;
}) {
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
            href={`/stats/${view}/${season.year}`}
          >
            {season.year} Stats
          </YearSelectorItem>
        ))}
    </>
  );
}

export default StatsHeader;
