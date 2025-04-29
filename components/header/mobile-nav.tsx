"use client";

import React from "react";
import { FaTrophy, FaMoneyBill, FaChartArea, FaUsers } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";

import { cn } from "@/lib/utils";
import Link from "next/link";

function MobileNav() {
  const pathname = usePathname();

  return (
    <div
      id="mobile-nav"
      className={cn(
        "px-2 md:hidden block pt-2 fixed bottom-0 z-10 bg-background left-0 w-screen border-t border-t-primary"
      )}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              pathname.includes("cash") && "text-primary"
            )}
            href="/stats/cash?year=2025">
            <FaMoneyBill className="w-6 h-6" />
            Cash
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              pathname.includes("tournament") && "text-primary"
            )}
            href="/stats/tournaments">
            <FaTrophy className="w-6 h-6" />
            Tourney's
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              pathname.includes("members") && "text-primary"
            )}
            href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              pathname.includes("poy") && "text-primary"
            )}
            href="/poy">
            <FaRankingStar className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              pathname.includes("nlpi") && "text-primary"
            )}
            href="/nlpi">
            <TbWorldStar className="w-6 h-6" />
            NLPI
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobileNav;
