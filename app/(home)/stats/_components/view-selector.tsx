import LinkTabs, { LinkTab } from "@/components/page-header/link-tabs";
import React from "react";

// Cumulative / Cash / Tournament tabs, keeping the selected year (or career).
export function statsViewTabs(
  currentView: string,
  currentYear: string | number,
): LinkTab[] {
  return [
    { view: "cumulative", label: "Cumulative" },
    { view: "cash", label: "Cash" },
    { view: "tournament", label: "Tournament" },
  ].map(({ view, label }) => ({
    href: `/stats/${view}/${currentYear}`,
    label,
    active: view === currentView,
  }));
}

// The view tabs on the mobile stats header's second row; the header has pb-0,
// so the tabs' underline sits on its bottom border.
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
      <LinkTabs tabs={statsViewTabs(currentView, currentYear)} />
    </div>
  );
}

export default ViewSelector;
