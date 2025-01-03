"use client";

import React from "react";
import Link from "next/link";
import {
  ChartColumnBigIcon,
  Eye,
  LayoutDashboard,
  PlusCircle,
  Trophy,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";

const styles = cva(
  "hover:border-primary hover:text-primary flex items-center gap-3 border-b-4 py-2 px-4",
  {
    variants: {
      state: {
        active: "text-primary border-primary",
        inactive: "border-muted",
      },
    },
  }
);

function AdminNav() {
  const path = usePathname();
  return (
    <div className="w-full">
      <ul className="pl-2 flex item-center justify-center">
        <li>
          <Link
            className={styles({
              state: path === "/admin" ? "active" : "inactive",
            })}
            href="/admin">
            Dashboard
            <LayoutDashboard size="16" strokeWidth={2} />
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state: path.includes("members") ? "active" : "inactive",
            })}
            href="/admin/members">
            Members
            <User size="16" strokeWidth={2} />
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state: path.includes("stats") ? "active" : "inactive",
            })}
            href="/admin/stats">
            Stats
            <ChartColumnBigIcon size="16" strokeWidth={2} />
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state: path.includes("records") ? "active" : "inactive",
            })}
            href="/admin/records">
            Records
            <Trophy size="16" strokeWidth={2} />
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default AdminNav;
