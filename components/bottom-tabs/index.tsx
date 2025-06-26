"use client";

import React from "react";
import { FaTrophy, FaMoneyBill, FaChartArea, FaUsers } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";

import { cn } from "@/lib/utils";
import Link from "next/link";

function BottomTabs() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string>("");

  React.useEffect(() => {
    if (pathname.includes("cash")) {
      setActive("cash");
    } else if (pathname.includes("tournament")) {
      setActive("tournament");
    } else if (pathname.includes("members")) {
      setActive("members");
    } else if (pathname.includes("poy")) {
      setActive("poy");
    } else if (pathname.includes("nlpi")) {
      setActive("nlpi");
    } else {
      setActive("");
    }
  }, [pathname]);

  return (
    <div
      id="mobile-nav"
      className={cn(
        "p-2 md:hidden block fixed bottom-0 z-10 bg-background left-0 w-screen border-t border-t-primary"
      )}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("");
              setActive("cash");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 font-semibold h-12 text-xs",
              active === "cash" && "text-primary"
            )}
            href="/stats/cash?year=2025">
            <FaMoneyBill className="w-5 h-5 mt-[0.1rem]" />
            Cash
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("");
              setActive("tournament");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 font-semibold h-12 text-xs",
              active === "tournament" && "text-primary"
            )}
            href="/stats/tournaments">
            <FaTrophy className="w-5 h-5 mt-[0.1rem]" />
            Tourney's
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("");
              setActive("members");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 font-semibold h-12 text-xs",
              active === "members" && "text-primary"
            )}
            href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("");
              setActive("poy");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 font-semibold h-12 text-xs",
              active === "poy" && "text-primary"
            )}
            href="/poy">
            <FaRankingStar className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("");
              setActive("nlpi");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 font-semibold h-12 text-xs",
              active === "nlpi" && "text-primary"
            )}
            href="/nlpi">
            <TbWorldStar className="w-5 h-5 mt-[0.1rem]" />
            NLPI
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default BottomTabs;
