"use client";

import { ColumnDef } from "@tanstack/react-table";
import { NLPIData } from "@/utils/types";
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

export const columns: ColumnDef<NLPIData & { previousYear: number | null }>[] =
  [
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
      accessorKey: "last_year_rank",
      header: ({ column, table }) => {
        return (
          <SortButton
            label={`${table.getRowModel().rows[0].original.previousYear}`}
            direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
            isSorted={column.getIsSorted()}
            onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        );
      },
      cell: ({ row }) => {
        const lastWeekRank = parseInt(row.getValue("last_year_rank"));
        const displayValue =
          lastWeekRank === 0 ? <Minus size={14} /> : lastWeekRank;
        return <span>{displayValue}</span>;
      },
      sortingFn: (rowA, rowB) => {
        const lastYearRankA = parseInt(rowA.getValue("last_year_rank")) || 0;
        const lastYearRankB = parseInt(rowB.getValue("last_year_rank")) || 0;

        // Treat 0 as "infinity" (worst possible rank)
        const rankA =
          lastYearRankA === 0 ? Number.MAX_SAFE_INTEGER : lastYearRankA;
        const rankB =
          lastYearRankB === 0 ? Number.MAX_SAFE_INTEGER : lastYearRankB;

        return rankA - rankB;
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
      accessorKey: "avg_points",
      header: ({ column }) => (
        <SortButton
          label="Avg"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) =>
        (row.original.total_points / row.original.divisor).toFixed(3),

      // 👇 Add this part
      sortingFn: (rowA, rowB) => {
        const avgA = rowA.original.total_points / rowA.original.divisor || 0;
        const avgB = rowB.original.total_points / rowB.original.divisor || 0;
        return avgA - avgB;
      },
    },
    {
      accessorKey: "total_points",
      header: ({ column }) => (
        <SortButton
          label="Total"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) => {
        return <>{row.original.total_points.toFixed(3)}</>;
      },
    },
    {
      accessorKey: "avg_cash",
      header: ({ column }) => (
        <SortButton
          label="Avg Cash"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) => {
        return (
          <>
            {(row.original.cash_points / row.original.cash_divisor).toFixed(3)}
          </>
        );
      },
      sortingFn: (rowA, rowB) => {
        const avgA =
          rowA.original.cash_points / rowA.original.cash_divisor || 0;
        const avgB =
          rowB.original.cash_points / rowB.original.cash_divisor || 0;
        return avgA - avgB;
      },
    },
    {
      accessorKey: "cash_points",
      header: ({ column }) => (
        <SortButton
          label="Cash"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) => {
        return <>{row.original.cash_points.toFixed(3)}</>;
      },
    },
    {
      accessorKey: "avg_tournament_points",
      header: ({ column }) => (
        <SortButton
          label="Avg Major"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) => {
        return (
          <>
            {(
              row.original.tournament_points / row.original.major_divisor
            ).toFixed(3)}
          </>
        );
      },
      sortingFn: (rowA, rowB) => {
        const avgA =
          rowA.original.tournament_points / rowA.original.major_divisor || 0;
        const avgB =
          rowB.original.tournament_points / rowB.original.major_divisor || 0;
        return avgA - avgB;
      },
    },
    {
      accessorKey: "major_points",
      header: ({ column }) => (
        <SortButton
          label="Major"
          direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
          isSorted={column.getIsSorted()}
          onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        />
      ),
      cell: ({ row }) => {
        return <>{row.original.tournament_points.toFixed(3)}</>;
      },
    },
  ];
