import { AlertCircle } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ErrorHandler from "@/components/error-handler";
import StatCards from "./cards";
import SessionsTable from "./sessions-table";
import { StatsTable } from "./table/table";
import { columns } from "./table/columns";
import { fetchStatsData } from "../_lib/utils/fetch-data";

interface Props {
  year: string;
  view: "cumulative" | "cash" | "tournament";
}

async function StatsMain({ year, view }: Props) {
  const result = await fetchStatsData(view, year);

  if (result.error) {
    return (
      <ErrorHandler
        title={result.title}
        errorMessage={result.error.message}
        pageTitle="Cash Stats"
      />
    );
  }

  const { members, stats, sessions, weeks } = result;

  if (stats.length === 0) {
    const viewLabel = view.charAt(0).toUpperCase() + view.slice(1);
    const dataType = view === "cumulative" ? "cash or tournament" : view;

    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>
            No {viewLabel} Stats Available for {year}
          </EmptyTitle>
          <EmptyDescription>
            No {dataType} data has been added for {year}. Once {dataType} data
            has been added for {year} you will see it here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <StatCards members={members} data={stats} />
      <StatsTable year={year} view={view} columns={columns} data={stats} />
      {view === "cash" && (
        <SessionsTable
          year={year}
          data={sessions}
          members={members}
          weeks={weeks}
        />
      )}
    </>
  );
}

export default StatsMain;
