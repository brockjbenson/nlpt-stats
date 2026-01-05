"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeasonCashStats } from "@/utils/types";
import { DataTable } from "./stats-table/table";
import { columns } from "./stats-table/columns";

interface Props {
  seasonStats: SeasonCashStats[];
}

function StatsTable({ seasonStats }: Props) {
  return (
    <div className="px-2">
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="m-0 p-0">Cash Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={seasonStats} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}

export default StatsTable;
