"use client";

import React, { useEffect } from "react";
import {
  FaTrophy,
  FaMoneyBill,
  FaChartArea,
  FaUsers,
  FaHome,
} from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";
import { FaChartLine } from "react-icons/fa6";
import { PiTriangleFill } from "react-icons/pi";

import { cn } from "@/lib/utils";
import Link from "next/link";

function BottomTabs() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string>("");
  const [statsTabOpen, setStatsTabOpen] = React.useState<boolean>(false);
  const statsTabRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (pathname.includes("cash")) {
      setActive("cash+stats");
    } else if (pathname.includes("tournament")) {
      setActive("tournament+stats");
    } else if (pathname.includes("members")) {
      setActive("members");
    } else if (pathname.includes("poy")) {
      setActive("poy");
    } else if (pathname.includes("nlpi")) {
      setActive("nlpi");
    } else if (pathname === "/") {
      setActive("home");
    } else if (pathname.includes("stats")) {
      setActive("stats");
    } else {
    }
  }, [pathname]);

  const toggleStatsTab = () => {
    setStatsTabOpen(!statsTabOpen);
  };

  useEffect(() => {
    if (!statsTabOpen) return;
    document.addEventListener("click", (e) => {
      if (
        statsTabRef.current &&
        !statsTabRef.current.contains(e.target as Node)
      ) {
        setStatsTabOpen(false);
      }
    });
  }, [statsTabOpen]);

  return (
    <div
      id="mobile-nav"
      className={cn(
        "p-2 md:hidden block fixed bottom-0 z-10 bg-background left-0 w-screen border-t border-t-primary"
      )}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <button
            ref={statsTabRef}
            onClick={toggleStatsTab}
            className={cn(
              "flex flex-col items-center justify-between gap-1 h-12 text-xs",
              statsTabOpen
                ? "text-primary font-semibold"
                : active === "cash+stats" || active === "tournament+stats"
                  ? "text-primary font-semibold"
                  : "text-neutral-600 font-medium"
            )}>
            <FaChartLine className="w-5 h-5 mt-[0.1rem]" />
            Stats
          </button>
          <div
            className={cn(
              "absolute rounded-[8px] flex flex-col left-4 p-4 gap-4 bg-background w-32 -top-[120%] border border-neutral-500",
              statsTabOpen ? "flex" : "hidden"
            )}>
            <PiTriangleFill className="absolute -bottom-[0.8rem] text-neutral-500 w-4 h-4 rotate-180" />
            <PiTriangleFill className="absolute -bottom-[0.7rem] text-background w-4 h-4 rotate-180" />

            <Link
              onClick={() => {
                setActive("cash+stats");
                setStatsTabOpen(false);
              }}
              scroll={true}
              className={cn(
                "flex items-center justify-start gap-2 text-xs",
                active === "cash+stats"
                  ? "text-primary font-semibold"
                  : "text-neutral-600 font-medium"
              )}
              href="/stats/cash?year=2025">
              <FaMoneyBill className="w-5 h-5 " />
              Cash
            </Link>
            <Link
              onClick={() => {
                setActive("tournament+stats");
                setStatsTabOpen(false);
              }}
              scroll={true}
              className={cn(
                "flex items-center justify-start gap-2 text-xs",
                active === "tournament+stats"
                  ? "text-primary font-semibold"
                  : "text-neutral-600 font-medium"
              )}
              href="/stats/tournaments">
              <FaTrophy className="w-5 h-5 " />
              Tourney's
            </Link>
          </div>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("members");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 h-12 text-xs",
              active === "members"
                ? "text-primary font-semibold"
                : "text-neutral-600 font-medium"
            )}
            href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("home");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 h-12 text-xs",
              active === "home"
                ? "text-primary font-semibold"
                : "text-neutral-600 font-medium"
            )}
            href="/">
            <FaHome className="w-6 h-6" />
            Home
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("poy");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 h-12 text-xs",
              active === "poy"
                ? "text-primary font-semibold"
                : "text-neutral-600 font-medium"
            )}
            href="/poy">
            <FaRankingStar className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setActive("nlpi");
            }}
            scroll={true}
            className={cn(
              "flex flex-col items-center justify-between gap-1 h-12 text-xs",
              active === "nlpi"
                ? "text-primary font-semibold"
                : "text-neutral-600 font-medium"
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
