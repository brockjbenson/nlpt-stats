"use client";

import { YearSelectorTriggerSkeleton } from "@/components/page-header/year-selector";
import { usePathname } from "next/navigation";
import React from "react";
import ViewSelector from "./view-selector";

const VIEWS = ["cumulative", "cash", "tournament"] as const;

// Stats header contents for the loading state: the year title and the view
// tabs. loading.tsx doesn't get the route params, so the view and year come
// from the URL being loaded (/stats/{view}/{year}).
function StatsHeaderSkeleton() {
  const [, , viewSegment, yearSegment] = usePathname().split("/");
  const view = VIEWS.find((v) => v === viewSegment) ?? "cumulative";
  const year = yearSegment || String(new Date().getFullYear());

  return (
    <>
      <YearSelectorTriggerSkeleton>
        {year === "career" ? "Career" : year} Stats
      </YearSelectorTriggerSkeleton>
      <ViewSelector currentView={view} currentYear={year} />
    </>
  );
}

export default StatsHeaderSkeleton;
