"use client";

import { YearSelectorTriggerSkeleton } from "@/components/page-header/year-selector";
import LinkTabs from "@/components/page-header/link-tabs";
import { usePathname } from "next/navigation";
import React from "react";
import ViewSelector, { statsViewTabs } from "./view-selector";

const VIEWS = ["cumulative", "cash", "tournament"] as const;

// loading.tsx doesn't get the route params, so the view and year come from
// the URL being loaded (/stats/{view}/{year}). A URL without a year
// (/stats/cash) is about to redirect to the current year's page, so the year
// is "" (a prebuilt page can't read the clock to fill it in).
function useStatsPath() {
  const [, , viewSegment, yearSegment] = usePathname().split("/");
  const view = VIEWS.find((v) => v === viewSegment) ?? "cumulative";
  const year = yearSegment ?? "";
  return { view, year };
}

// Mobile stats header contents for the loading state: the year title and the
// view tabs.
function StatsHeaderSkeleton() {
  const { view, year } = useStatsPath();

  return (
    <>
      <YearSelectorTriggerSkeleton>
        {year === "career" ? "Career Stats" : `${year} Stats`.trim()}
      </YearSelectorTriggerSkeleton>
      <ViewSelector currentView={view} currentYear={year} />
    </>
  );
}

// The desktop header's view tabs for the loading state.
export function StatsDesktopViewTabsSkeleton() {
  const { view, year } = useStatsPath();
  return <LinkTabs variant="chips" tabs={statsViewTabs(view, year)} />;
}

export default StatsHeaderSkeleton;
