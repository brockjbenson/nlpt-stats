import { cn } from "@/lib/utils";
import { Season } from "@/utils/types";
import Link from "next/link";
import React from "react";

function ViewSelector({
  currentView,
  activeSeason,
  currentYear,
}: {
  currentView: string;
  activeSeason: Season | null;
  currentYear: string | number;
}) {
  const yearParam = activeSeason?.year ?? currentYear;

  return (
    <div className="col-start-1 row-start-2 col-span-3 w-full">
      <ul className="w-full flex items-center justify-start">
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-0.75 px-2",
              currentView === "cumulative" && "text-primary after:bg-primary"
            )}
            href={`/stats/?year=${yearParam}&view=cumulative`}>
            Cumulative
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-0.75 px-2",
              currentView === "cash" && "text-primary after:bg-primary"
            )}
            href={`/stats/?year=${yearParam}&view=cash`}>
            Cash
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              "relative after:w-full after:bg-transparent after:absolute after:h-px after:left-0 after:-bottom-0.75 px-2",
              currentView === "tournament" && "text-primary after:bg-primary"
            )}
            href={`/stats/?year=${yearParam}&view=tournament`}>
            Tournament
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default ViewSelector;
