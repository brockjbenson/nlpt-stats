"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { POYData } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { FaLongArrowAltDown } from "react-icons/fa";

function POYTable({ data: poyData }: { data: POYData[] }) {
  const [sort, setSort] = React.useState({
    column: "total_points",
    direction: "desc",
  });
  const [sortedPOYData, setSortedPOYData] = React.useState<POYData[]>(
    [...poyData].sort((a, b) => a.first_name.localeCompare(b.first_name))
  );

  const getRankChangeInfo = (
    currentRank: number,
    lastWeekRank: number | null
  ) => {
    if (lastWeekRank === null) {
      return {
        positive: false,
        change: 0,
        color: "text-theme-green",
        icon: <ArrowUp size={16} />,
      };
    }
    if (currentRank === lastWeekRank) {
      return {
        positive: false,
        change: 0,
        color: "text-foreground",
        icon: <Minus className="text-foreground" size={14} />,
      };
    }
    return currentRank < lastWeekRank
      ? {
          positive: true,
          change: lastWeekRank - currentRank,
          color: "text-theme-green",
          icon: <ArrowUp className="text-theme-green" size={16} />,
        }
      : {
          positive: false,
          change: currentRank - lastWeekRank,
          color: "text-theme-red",
          icon: <ArrowDown className="text-theme-red" size={16} />,
        };
  };

  React.useEffect(() => {
    let sortedStats = [...poyData];

    sortedStats.sort((a, b) => {
      let aValue: number | string = "";
      let bValue: number | string = "";

      switch (sort.column) {
        case "first_name":
          aValue = a.first_name;
          bValue = b.first_name;
          break;
        case "last_week_rank":
          aValue = a.last_week_rank || 0;
          bValue = b.last_week_rank || 0;
          break;
        case "rank":
          aValue = a.rank || 0;
          bValue = b.rank || 0;
          break;
        case "total_points":
          aValue = a.total_points || 0;
          bValue = b.total_points || 0;
          break;
        case "avg_points":
          aValue = a.avg_points || 0;
          bValue = b.avg_points || 0;
          break;
        case "cash_points":
          aValue = a.cash_points || 0;
          bValue = b.cash_points || 0;
          break;
        case "avg_cash_points":
          aValue = a.avg_cash_points || 0;
          bValue = b.avg_cash_points || 0;
          break;
        case "major_points":
          aValue = a.major_points || 0;
          bValue = b.major_points || 0;
          break;
        case "avg_major_points":
          aValue = a.avg_major_points || 0;
          bValue = b.avg_major_points || 0;
          break;
        case "cash_played":
          aValue = a.cash_played || 0;
          bValue = b.cash_played || 0;
          break;
        case "majors_played":
          aValue = a.majors_played || 0;
          bValue = b.majors_played || 0;
          break;

        default:
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        return 0;
      }
    });

    setSortedPOYData(sortedStats);
  }, [sort, poyData]);

  const handleSort = (column: string, direction: "asc" | "desc") => {
    let newDirection;

    if (sort.column === column) {
      // Same column: toggle
      newDirection = sort.direction === "asc" ? "desc" : "asc";
    } else if (direction) {
      newDirection = direction;
    } else {
      // New column: start with desc
      newDirection = "desc";
    }

    const newSort = { column, direction: newDirection };
    setSort(newSort);
  };

  const renderSortButton = (
    column: string,
    label: string,
    direction: "asc" | "desc" = "desc"
  ) => (
    <button
      className="w-full whitespace-nowrap flex justify-between items-center gap-2"
      onClick={(e) => handleSort(column, direction)}>
      {label}
      <FaLongArrowAltDown
        className={cn(
          sort.column === column ? "opacity-100" : "opacity-0",
          sort.direction === "asc" ? "rotate-0" : "rotate-180"
        )}
      />
    </button>
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pr-2 sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
            {renderSortButton("rank", "Rank", "asc")}
          </TableHead>
          <TableHead className="pr-0">
            {renderSortButton("last_week_rank", "Last Week", "asc")}
          </TableHead>
          <TableHead className="sticky pr-2 left-[56px] z-10 bg-card border-b-[1.7px] border-neutral-600">
            {renderSortButton("first_name", "Member", "asc")}
          </TableHead>
          <TableHead className="pl-6">Points Behind</TableHead>
          <TableHead>
            {renderSortButton("total_points", "Total Points")}
          </TableHead>
          <TableHead>{renderSortButton("avg_points", "Avg Points")}</TableHead>
          <TableHead>
            {renderSortButton("cash_points", "Cash Points")}
          </TableHead>
          <TableHead>
            {renderSortButton("avg_cash_points", "Avg Cash Points")}
          </TableHead>
          <TableHead>
            {renderSortButton("major_points", "Major Points")}
          </TableHead>
          <TableHead>
            {renderSortButton("avg_major_points", "Avg Major Points")}
          </TableHead>
          <TableHead>
            {renderSortButton("cash_played", "Cash Played")}
          </TableHead>
          <TableHead>
            {renderSortButton("majors_played", "Majors Played")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPOYData.map((data: POYData) => {
          if (data.total_points === 0) {
            return null;
          }
          const changeData = getRankChangeInfo(data.rank, data.last_week_rank);
          const leaderPoints = poyData[0].total_points;
          return (
            <TableRow key={data.member_id}>
              <TableCell className="pr-0 sticky left-0 z-10 bg-card border-b-[1.7px] border-neutral-600">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(changeData.color, "flex items-center gap-1")}>
                    {changeData.icon}
                  </span>
                  {data.rank}
                </span>
              </TableCell>
              <TableCell className="text-center pr-4">
                {data.last_week_rank > 0 ? (
                  data.last_week_rank
                ) : (
                  <Minus size={14} />
                )}
              </TableCell>
              <TableCell className="pr-2 sticky left-[56px] z-10 bg-card border-b-[1.7px] border-neutral-600">
                <Link href={`/members/${data.member_id}`}>
                  {data.first_name} {data.last_name.slice(0, 1)}.
                </Link>
              </TableCell>
              <TableCell className="pl-6">
                {leaderPoints - data.total_points === 0 ? (
                  <Minus size={14} />
                ) : (
                  (leaderPoints - data.total_points).toFixed(2)
                )}
              </TableCell>
              <TableCell>{data.total_points.toFixed(2)}</TableCell>
              <TableCell>{(data.avg_points || 0).toFixed(2)}</TableCell>
              <TableCell>{(data.cash_points || 0).toFixed(2)}</TableCell>
              <TableCell>{(data.avg_cash_points || 0).toFixed(2)}</TableCell>
              <TableCell>{(data.major_points || 0).toFixed(2)}</TableCell>
              <TableCell>{(data.avg_major_points || 0).toFixed(2)}</TableCell>
              <TableCell>{data.cash_played || 0}</TableCell>
              <TableCell>{data.majors_played || 0}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default POYTable;
