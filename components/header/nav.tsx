"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { User } from "@supabase/supabase-js";
const styles = cva(
  "relative after:content-[''] after:absolute text-base font-medium after:transition-all after:duration-300 after:ease-in-out after:opacity-100 after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-[2px] after:bg-primary",
  {
    variants: {
      state: {
        active: "text-primary after:w-full",
        inactive: "hover:text-primary after:w-0 hover:after:w-full",
      },
    },
  }
);

function Nav({ excludeAdmin }: { excludeAdmin: boolean }) {
  const path = usePathname();

  const isAdminPage = path.includes("admin");

  return (
    <nav>
      <ul className="flex gap-8">
        <li>
          <Link
            className={styles({
              state:
                path.includes("members") && !isAdminPage
                  ? "active"
                  : "inactive",
            })}
            href="/members">
            Members
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state:
                path.includes("stats") && !isAdminPage ? "active" : "inactive",
            })}
            href="/stats">
            Stats
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state:
                path.includes("records") && !isAdminPage
                  ? "active"
                  : "inactive",
            })}
            href="/records">
            Records
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state:
                path.includes("nlpi") && !isAdminPage ? "active" : "inactive",
            })}
            href="/nlpi">
            NLPI Rankings
          </Link>
        </li>
        <li>
          <Link
            className={styles({
              state:
                path.includes("poy") && !isAdminPage ? "active" : "inactive",
            })}
            href="/poy">
            POY Race
          </Link>
        </li>
        {!excludeAdmin && (
          <li>
            <Link
              className={styles({
                state: path.includes("admin") ? "active" : "inactive",
              })}
              href="/admin">
              Admin
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Nav;
