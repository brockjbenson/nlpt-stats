"use client";

import { ColumnDef } from "@tanstack/react-table";
import { POYData } from "@/utils/types";
import SortButton from "@/components/ui/sort-button";
import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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

export const columns: ColumnDef<POYData>[] = [
  {
    accessorKey: "member_id",
    enableHiding: true,
    header: ({ column }) => <span className="hidden">{column.id}</span>,
    cell: ({ row }) => {
      return <span className="hidden">{row.getValue("member_id")}</span>;
    },
  },
  {
    accessorKey: "rank",
    header: ({ column }) => (
      <SortButton
        label="Rank"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const changeData = getRankChangeInfo(
        row.getValue("rank"),
        row.original.last_week_rank
      );
      return (
        <span className="flex items-center gap-2">
          <span className={cn(changeData.color, "flex items-center gap-1")}>
            {changeData.icon}
          </span>
          {row.getValue("rank")}
        </span>
      );
    },
  },
  {
    accessorKey: "last_week_rank",
    header: ({ column }) => (
      <SortButton
        label={"Prev"}
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const lastWeekRank = parseInt(row.getValue("last_week_rank"));
      const displayValue =
        lastWeekRank === 0 ? <Minus size={14} /> : lastWeekRank;
      return <span>{displayValue}</span>;
    },
  },
  {
    accessorKey: "first_name",
    header: ({ column }) => (
      <SortButton
        label="Member"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      return (
        <Link href={`/members/${row.getValue("member_id")}`}>
          {row.original.first_name} {row.original.last_name.slice(0, 1)}.
        </Link>
      );
    },
  },
  {
    accessorKey: "points_behind",
    header: () => <>{"Points Behind"}</>,
    cell: ({ row, table }) => {
      const leaderPoints = table.getRowModel().rows[0].original.total_points;
      const pointsBehind =
        leaderPoints - row.original.total_points === 0 ? (
          <Minus size={14} />
        ) : (
          (leaderPoints - row.original.total_points).toFixed(2)
        );
      return <>{pointsBehind}</>;
    },
  },
  {
    accessorKey: "total_points",
    header: ({ column }) => (
      <SortButton
        label="Total Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.total_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "avg_points",
    header: ({ column }) => (
      <SortButton
        label="Avg Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.avg_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "cash_points",
    header: ({ column }) => (
      <SortButton
        label="Cash Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.cash_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "avg_cash_points",
    header: ({ column }) => (
      <SortButton
        label="Avg Cash Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.avg_cash_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "major_points",
    header: ({ column }) => (
      <SortButton
        label="Major Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.major_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "avg_major_points",
    header: ({ column }) => (
      <SortButton
        label="Avg Major Points"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.avg_major_points.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "cash_played",
    header: ({ column }) => (
      <SortButton
        label="Cash Played"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.cash_played.toFixed(2)}</>;
    },
  },
  {
    accessorKey: "majors_played",
    header: ({ column }) => (
      <SortButton
        label="Majors Played"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      return <>{row.original.majors_played.toFixed(2)}</>;
    },
  },
];
