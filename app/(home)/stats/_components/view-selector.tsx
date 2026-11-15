import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

// Block-level tab whose underline sits on the header's bottom border.
// The header has pb-0, so the tab's bottom edge is the border's top edge;
// -bottom-px moves the 1px underline down onto the border itself.
const TAB_CLASS =
  "relative block px-2 pt-1 pb-2 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-transparent";

// Cumulative / Cash / Tournament tabs on the stats header's second row.
// Its own file (no server imports) so the loading state's header can use it.
function ViewSelector({
  currentView,
  currentYear,
}: {
  currentView: string;
  currentYear: string | number;
}) {
  return (
    <div className="col-start-1 row-start-2 col-span-3 w-full">
      <ul className="w-full flex items-center justify-start">
        <li>
          <Link
            className={cn(
              TAB_CLASS,
              currentView === "cumulative" && "text-primary after:bg-primary",
            )}
            href={`/stats/cumulative/${currentYear}`}>
            Cumulative
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              TAB_CLASS,
              currentView === "cash" && "text-primary after:bg-primary",
            )}
            href={`/stats/cash/${currentYear}`}>
            Cash
          </Link>
        </li>
        <li>
          <Link
            className={cn(
              TAB_CLASS,
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

export default ViewSelector;
