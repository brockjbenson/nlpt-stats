"use client";

import React from "react";
import { FaTrophy, FaUsers } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";
import { cn } from "@/lib/utils";
import BottomTab from "./tab";
import { LineChart } from "lucide-react";
import { useScrollState } from "@/app/providers/scroll-context"; // ⚠️ USE ONE PATH

function BottomTabs() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string>("");
  const currentYear = new Date().getFullYear();

  const { navTranslateY } = useScrollState();

  React.useEffect(() => {
    if (pathname.includes("stats")) setActive("stats");
    else if (pathname.includes("tournament")) setActive("tournament");
    else if (pathname.includes("members")) setActive("members");
    else if (pathname.includes("poy")) setActive("poy");
    else if (pathname.includes("nlpi")) setActive("nlpi");
    else if (pathname === "/") setActive("home");
  }, [pathname]);

  return (
    <div
      id="mobile-nav"
      className={cn(
        "px-2 pb-2 pt-1 md:hidden block fixed bottom-0 z-10 bg-background/70 backdrop-blur-sm left-0 w-screen border-t border-t-neutral-700"
      )}
      style={{
        transform: `translateY(${navTranslateY}px)`,
        willChange: "transform",
      }}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab id="stats" active={active} href="/stats">
            <LineChart className="w-6 h-6" />
            Stats
          </BottomTab>
        </li>

        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab id="tournament" active={active} href="/tournaments">
            <FaTrophy className="w-5 h-5 mt-1" />
            {"Tourney's"}
          </BottomTab>
        </li>

        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab id="members" active={active} href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </BottomTab>
        </li>

        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab id="poy" active={active} href={`/poy/${currentYear}`}>
            <FaRankingStar className="w-6 h-6" />
            POY
          </BottomTab>
        </li>

        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab id="nlpi" active={active} href="/nlpi">
            <TbWorldStar className="w-5 h-5 mt-[0.1rem]" />
            NLPI
          </BottomTab>
        </li>
      </ul>
    </div>
  );
}

export default BottomTabs;
