import PageHeader from "@/components/page-header/page-header";
import {
  YearSelector,
  YearSelectorContent,
  YearSelectorItem,
  YearSelectorTrigger,
} from "@/components/page-header/year-selector";
import { AlertCircle, ChevronDown } from "lucide-react";
import React from "react";
import StatCards from "./cards";
import ViewSelector from "../view-selector";
import { Member, Season } from "@/utils/types";
import { StatsData } from "../lib/types";
import { StatsTable } from "./table/table";
import { columns } from "./table/columns";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface Props {
  year: string;
  seasons: Season[];
  members: Member[];
  stats: StatsData[];
  isCareer: boolean;
  view: "cumulative" | "cash" | "tournament";
}

function StatsMain({ year, seasons, members, stats, isCareer, view }: Props) {
  const activeSeason = seasons?.find(
    (season) => season.year.toString() === year
  );
  return (
    <>
      <PageHeader className="pb-0">
        <YearSelector>
          <YearSelectorTrigger>
            {year === "career" ? "Career" : year} Stats{" "}
            <ChevronDown className="ml-1 size-4" />
          </YearSelectorTrigger>
          <YearSelectorContent>
            <YearSelectorItem href={`/stats/${view}/career`} active={isCareer}>
              Career Stats
            </YearSelectorItem>
            {seasons
              .sort((a, b) => b.year - a.year)
              .map((season) => (
                <YearSelectorItem
                  key={season.id}
                  active={season.id === activeSeason?.id}
                  href={`/stats/${view}/${season.year}`}>
                  {season.year} Stats
                </YearSelectorItem>
              ))}
          </YearSelectorContent>
        </YearSelector>
        {stats.length === 0}

        <ViewSelector
          currentYear={year}
          currentView={view}
          activeSeason={isCareer ? undefined : activeSeason}
        />
      </PageHeader>
      {stats.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>
              No {view.charAt(0).toUpperCase() + view.slice(1)} Stats Available
              for {year}
            </EmptyTitle>
            <EmptyDescription>
              No {view === "cumulative" ? "cash or tournament" : view} data has
              been added for {year}. Once{" "}
              {view === "cumulative" ? "cash or tournament" : view} data has
              been added for {year} you will see it here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <StatCards members={members} data={stats} />
          <StatsTable year={year} view={view} columns={columns} data={stats} />
        </>
      )}
    </>
  );
}

export default StatsMain;
