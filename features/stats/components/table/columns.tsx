"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import SortButton from "@/components/ui/sort-button";
import Link from "next/link";
import { StatsData } from "../../lib/types";

export const columns: ColumnDef<StatsData>[] = [
  {
    accessorKey: "member_id",
    enableHiding: true,
    header: ({ column }) => <span className="hidden">{column.id}</span>,
    cell: ({ row }) => {
      return <span className="hidden">{row.getValue("member_id")}</span>;
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
      const id = row.getValue("member_id");
      return (
        <Link className="p-0" href={`/members/${id}`}>
          {row.getValue("first_name")}
        </Link>
      );
    },
  },
  {
    accessorKey: "net_profit",
    header: ({ column }) => (
      <SortButton
        label="Net Profit"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("net_profit"));
      const formatted = formatMoney(amount);
      return <span className={getProfitTextColor(amount)}>{formatted}</span>;
    },
  },
  {
    accessorKey: "gross_profit",
    header: ({ column }) => (
      <SortButton
        label="Gross Profit"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("gross_profit"));
      const formatted = formatMoney(amount);
      return <span className={getProfitTextColor(amount)}>{formatted}</span>;
    },
  },
  {
    accessorKey: "gross_losses",
    header: ({ column }) => (
      <SortButton
        label="Gross Loss"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number>("gross_losses");
      const formatted = value === 0 ? "0.00" : formatMoney(value * -1);
      return (
        <span className={getProfitTextColor(value === 0 ? 0 : value * -1)}>
          {formatted}
        </span>
      );
    },
  },
  {
    accessorKey: "session_avg",
    header: ({ column }) => (
      <SortButton
        label="Avg Session"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("session_avg"));
      const formatted = formatMoney(amount);
      return <span className={getProfitTextColor(amount)}>{formatted}</span>;
    },
  },
  {
    accessorKey: "avg_win",
    header: ({ column }) => (
      <SortButton
        label="Avg Win"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("avg_win")) || 0;
      const formatted = formatMoney(amount);
      return <span className={getProfitTextColor(amount)}>{formatted}</span>;
    },
  },
  {
    accessorKey: "avg_loss",
    header: ({ column }) => (
      <SortButton
        label="Avg Loss"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("avg_loss")) * -1;
      const formatted = isNaN(amount) ? "0.00" : formatMoney(amount);
      return <span className={getProfitTextColor(amount)}>{formatted}</span>;
    },
  },
  {
    accessorKey: "avg_buy_in",
    header: ({ column }) => (
      <SortButton
        label="Avg Buy In"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("avg_buy_in"));
      const formatted = formatMoney(amount);
      return <span>{formatted}</span>;
    },
  },
  {
    accessorKey: "avg_rebuys",
    header: ({ column }) => (
      <SortButton
        label="Avg Rebuys"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("avg_rebuys"));
      const sessions = parseFloat(row.getValue("sessions_played"));
      const value = sessions > 0 ? amount / sessions : 0;
      return <span>{value.toFixed(2)}</span>;
    },
    sortingFn: (rowA, rowB) => {
      const aAmount = parseFloat(rowA.getValue("avg_rebuys"));
      const aSessions = parseFloat(rowA.getValue("sessions_played"));
      const bAmount = parseFloat(rowB.getValue("avg_rebuys"));
      const bSessions = parseFloat(rowB.getValue("sessions_played"));

      const aValue = aSessions > 0 ? aAmount / aSessions : 0;
      const bValue = bSessions > 0 ? bAmount / bSessions : 0;

      return aValue - bValue; // TanStack handles asc/desc automatically
    },
  },
  {
    accessorKey: "sessions_played",
    header: ({ column }) => (
      <SortButton
        label="Sessions"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
  },
  {
    accessorKey: "wins",
    header: ({ column }) => (
      <SortButton
        label="Wins"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
  },
  {
    accessorKey: "losses",
    header: ({ column }) => (
      <SortButton
        label="Losses"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
  },
  {
    accessorKey: "win_percentage",
    header: ({ column }) => (
      <SortButton
        label="Win Rate"
        direction={column.getIsSorted() === "asc" ? "asc" : "desc"}
        isSorted={column.getIsSorted()}
        onSort={() => column.toggleSorting(column.getIsSorted() !== "desc")}
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("win_percentage"));
      const formatted = `${amount.toFixed(2)}%`;
      const colorClass = amount < 50 ? "text-red-600" : "text-green-600";
      return <span className={colorClass}>{formatted}</span>;
    },
  },
];
