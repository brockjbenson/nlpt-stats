"use client";

import { YearSelectorTriggerSkeleton } from "@/components/page-header/year-selector";
import { usePathname } from "next/navigation";
import React from "react";

// Tournaments header title for the loading state. loading.tsx doesn't get the
// route params, so the year comes from the URL being loaded
// (/tournaments/{year}, or /tournaments for all of them).
function TournamentsHeaderSkeleton() {
  const year = usePathname().split("/")[2];
  return (
    <YearSelectorTriggerSkeleton>
      {year || "All"} Tournaments
    </YearSelectorTriggerSkeleton>
  );
}

export default TournamentsHeaderSkeleton;
