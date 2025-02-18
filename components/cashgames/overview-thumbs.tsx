"use client";

import { cn } from "@/lib/utils";
import { Medal } from "lucide-react";
import React from "react";
import { FaMoneyBill } from "react-icons/fa";
import { PiRanking } from "react-icons/pi";

interface PropType {
  selectedIndex: number;
  onClick: (index: number) => void;
}

function OverviewThumbs({ selectedIndex, onClick }: PropType) {
  return (
    <>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(0)}
          className={cn(
            "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
            selectedIndex === 0 && "text-primary"
          )}>
          Points
        </button>
      </div>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(1)}
          className={cn(
            "flex w-full gap-1 items-center justify-center whitespace-nowrap ",
            selectedIndex === 1 && "text-primary"
          )}>
          Wins
        </button>
      </div>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(2)}
          className={cn(
            "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
            selectedIndex === 2 && "text-primary"
          )}>
          Net Profit
        </button>
      </div>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(3)}
          className={cn(
            "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
            selectedIndex === 3 && "text-primary"
          )}>
          Gross Profit
        </button>
      </div>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(4)}
          className={cn(
            "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
            selectedIndex === 4 && "text-primary"
          )}>
          Win Percentage
        </button>
      </div>
      <div className="flex-[0_0_min-content] pl-4">
        <button
          onClick={() => onClick(5)}
          className={cn(
            "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
            selectedIndex === 5 && "text-primary"
          )}>
          Session Avg
        </button>
      </div>
    </>
  );
}

export default OverviewThumbs;
