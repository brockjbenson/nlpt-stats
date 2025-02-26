import { CashSessionWeekData } from "@/utils/types";
import React from "react";
import { cn } from "@/lib/utils";
import SessionTable from "./sessions/session-table";

interface Props {
  data: CashSessionWeekData; // Making sessions an array
  className?: string;
}

function RecentSession({ data, className }: Props) {
  return (
    <div className={cn("w-full mx-auto max-w-screen-xl", className)}>
      <div className="flex items-center mt-4 justify-between px-2 w-full">
        <h1 className="text-xl font-bold md:text-2xl">Recent Session</h1>
        <p className="text-sm md:text-base text-muted font-semibold">
          Week {data.week}, {data.year}
        </p>
      </div>
      <SessionTable data={data} />
    </div>
  );
}

export default RecentSession;
