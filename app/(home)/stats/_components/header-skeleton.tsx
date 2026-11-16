"use client";

import { YearSelectorTriggerSkeleton } from "@/components/page-header/year-selector";
import { usePathname } from "next/navigation";
import React from "react";
import ViewSelector from "./view-selector";

const VIEWS = ["cumulative", "cash", "tournament"] as const;

// Stats header contents for the loading state: the year title and the view
// tabs. loading.tsx doesn't get the route params, so the view and year come
// from the URL being loaded (/stats/{view}/{year}). A URL without a year
// (/stats/cash) is about to redirect to the current year's page, so it just
// says "Stats" (a prebuilt page can't read the clock to fill in the year).
function StatsHeaderSkeleton() {
  const [, , viewSegment, yearSegment] = usePathname().split("/");
  const view = VIEWS.find((v) => v === viewSegment) ?? "cumulative";
  const year = yearSegment ?? "";

  return (
    <>
      <YearSelectorTriggerSkeleton>
        {year === "career" ? "Career Stats" : `${year} Stats`.trim()}
      </YearSelectorTriggerSkeleton>
      <ViewSelector currentView={view} currentYear={year} />
    </>
  );
}

export default StatsHeaderSkeleton;
