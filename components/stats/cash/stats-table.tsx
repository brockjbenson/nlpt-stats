"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SeasonCashStats } from "@/utils/types";
import { X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { FaExpandAlt } from "react-icons/fa";
import { DataTable } from "./stats-table/table";
import { columns } from "./stats-table/columns";

interface Props {
  seasonStats: SeasonCashStats[];
}

function StatsTable({ seasonStats }: Props) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fullScreenMounted, setFullScreenMounted] = React.useState(false);

  const openFullScreen = () => {
    setIsFullscreen(true);
    setTimeout(() => {
      setFullScreenMounted(true);
    }, 10);
  };

  const closeFullScreen = () => {
    setFullScreenMounted(false);
    setTimeout(() => {
      setIsFullscreen(false);
    }, 300);
  };

  return (
    <>
      <div className="px-2">
        <Card className="w-full mb-4">
          <div className="flex pb-6 items-center justify-between">
            <CardTitle className="m-0 p-0">Cash Stats</CardTitle>
            <button
              onClick={openFullScreen}
              className="border-none w-4 h-4 flex items-center justify-center">
              <FaExpandAlt />
            </button>
          </div>
          <DataTable data={seasonStats} columns={columns} />
        </Card>
      </div>
      {isFullscreen &&
        createPortal(
          <div
            className={cn(
              "w-full h-screen fixed top-0 left-0 transition-transform duration-300 z-[12034812039481234]",
              fullScreenMounted ? "translate-y-0" : "translate-y-full"
            )}>
            <Card className="w-screen h-screen overflow-y-auto pt-16 border-none rounded-none">
              <div className="flex pb-6 items-center justify-between">
                <CardTitle className="m-0 p-0">Cash Stats</CardTitle>
                <button
                  onClick={closeFullScreen}
                  className="border-none w-6 h-6 flex items-center justify-center">
                  <X />
                </button>
              </div>
              <DataTable data={seasonStats} columns={columns} />
            </Card>
          </div>,
          document.body
        )}
    </>
  );
}

export default StatsTable;
