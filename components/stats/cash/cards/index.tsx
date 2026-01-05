"use client";

import { Member, POYData, SeasonCashStats } from "@/utils/types";
import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import OverviewThumbs from "./thumbnails";
import StatCard from "./stat-card";

interface Props {
  seasonStats: SeasonCashStats[];
  poyData: POYData[];
  members: Member[];
}

const OPTIONS: EmblaOptionsType = {};

function OverviewMobile({ seasonStats, poyData, members }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false); // ✅ Track drawer state
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(OPTIONS);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  useEffect(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;

    const handleSelect = () => {
      const index = emblaMainApi.selectedScrollSnap();
      setSelectedIndex(index);
      emblaThumbsApi.scrollTo(index);
    };

    handleSelect();
    emblaMainApi.on("select", handleSelect);
    emblaMainApi.on("reInit", handleSelect);

    return () => {
      emblaMainApi.off("select", handleSelect);
      emblaMainApi.off("reInit", handleSelect);
    };
  }, [emblaMainApi, emblaThumbsApi]);

  // ✅ Reinitialize Embla when drawer closes
  useEffect(() => {
    if (!drawerOpen && emblaMainApi && emblaThumbsApi) {
      // Small delay to ensure drawer animation is complete
      const timer = setTimeout(() => {
        emblaMainApi.reInit();
        emblaThumbsApi.reInit();
      }, 300); // Match drawer animation duration

      return () => clearTimeout(timer);
    }
  }, [drawerOpen, emblaMainApi, emblaThumbsApi]);

  // Sorted data
  const sortedPOY = [...poyData].sort((a, b) => b.cash_points - a.cash_points);
  const netProfitLeaders = [...seasonStats].sort(
    (a, b) => b.net_profit - a.net_profit
  );
  const winsLeaders = [...seasonStats].sort((a, b) => b.wins - a.wins);
  const grossProfitLeaders = [...seasonStats].sort(
    (a, b) => b.gross_profit - a.gross_profit
  );
  const winPercentageLeaders = [...seasonStats].sort(
    (a, b) => b.win_percentage - a.win_percentage
  );
  const sessionAverageLeaders = [...seasonStats].sort(
    (a, b) => b.session_avg - a.session_avg
  );

  const leaderPoints = sortedPOY[0]?.cash_points || 0;

  return (
    <div className="w-full pb-4 mx-auto md:hidden block">
      {/* Thumbnails */}
      <div className="mb-4 border-b pb-4 border-neutral-500">
        <div className="px-2 overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex flex-row -ml-4">
            <OverviewThumbs
              selectedIndex={selectedIndex}
              onClick={onThumbClick}
            />
          </div>
        </div>
      </div>

      {/* Main Carousel */}
      <div className="px-2 overflow-hidden" ref={emblaMainRef}>
        <div className="flex touch-pan-y -ml-4">
          {/* POY Points Card */}
          <StatCard<POYData>
            title="POY Points"
            data={sortedPOY}
            members={members}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p className="font-semibold text-lg md:text-xl">
                {item.cash_points.toFixed(2)}
              </p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-3">
                <span className="text-muted">Name</span>
                <span className="text-muted">Total</span>
                <span className="text-muted text-end">Points Behind</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                key={`${item.member_id}-poy`}>
                <h3 className="text-sm font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p className="font-semibold text-sm md:text-lg">
                  {item.cash_points.toFixed(2)}
                </p>
                <p className="font-semibold text-sm md:text-lg text-end">
                  {leaderPoints - item.cash_points === 0
                    ? "-"
                    : (leaderPoints - item.cash_points).toFixed(2)}
                </p>
              </div>
            )}
          />

          {/* Wins Card */}
          <StatCard<SeasonCashStats>
            title="Wins"
            data={winsLeaders}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p className="font-semibold text-lg md:text-xl">{item.wins}</p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                <span className="text-muted">Name</span>
                <span className="text-muted text-end">Wins</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full grid grid-cols-2 py-3 border-b border-neutral-600"
                key={`${item.member_id}-wins`}>
                <h3 className="text-base font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p className="font-semibold text-base md:text-lg text-end">
                  {item.wins}
                </p>
              </div>
            )}
          />

          {/* Net Profit Card */}
          <StatCard<SeasonCashStats>
            title="Net Profit"
            data={netProfitLeaders}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p
                className={cn(
                  "font-semibold text-lg md:text-xl",
                  getProfitTextColor(item.net_profit)
                )}>
                {formatMoney(item.net_profit)}
              </p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                <span className="text-muted">Name</span>
                <span className="text-muted text-end">Net</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full grid grid-cols-2 py-3 border-b border-neutral-600"
                key={`${item.member_id}-net`}>
                <h3 className="text-base font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p
                  className={cn(
                    "font-semibold text-base md:text-lg text-end",
                    getProfitTextColor(item.net_profit)
                  )}>
                  {formatMoney(item.net_profit)}
                </p>
              </div>
            )}
          />

          {/* Gross Profit Card */}
          <StatCard<SeasonCashStats>
            title="Gross Profit"
            data={grossProfitLeaders}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p
                className={cn(
                  "font-semibold text-lg md:text-xl",
                  getProfitTextColor(item.gross_profit)
                )}>
                {formatMoney(item.gross_profit)}
              </p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-2">
                <span className="text-muted">Name</span>
                <span className="text-muted text-end">Gross</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full flex justify-between items-center py-3 border-b border-neutral-600"
                key={`${item.member_id}-gross`}>
                <h3 className="text-base font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p
                  className={cn(
                    "font-semibold text-base md:text-lg",
                    getProfitTextColor(item.gross_profit)
                  )}>
                  {formatMoney(item.gross_profit)}
                </p>
              </div>
            )}
          />

          {/* Win Percentage Card */}
          <StatCard<SeasonCashStats>
            title="Win Percentage"
            data={winPercentageLeaders}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p className="font-semibold text-lg md:text-xl">
                {item.win_percentage.toFixed(2)}%
              </p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-3">
                <span className="text-muted">Name</span>
                <span className="text-muted">Sessions</span>
                <span className="text-muted text-end">Value</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                key={`${item.member_id}-winpct`}>
                <h3 className="text-base font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p className="font-semibold text-base md:text-lg">
                  {item.sessions_played}
                </p>
                <p className="font-semibold text-base md:text-lg">
                  {item.win_percentage.toFixed(2)}%
                </p>
              </div>
            )}
          />

          {/* Session Average Card */}
          <StatCard<SeasonCashStats>
            title="Session Avg"
            data={sessionAverageLeaders}
            onOpenChange={setDrawerOpen}
            renderValue={(item) => (
              <p
                className={cn(
                  "font-semibold text-lg md:text-xl",
                  getProfitTextColor(item.session_avg)
                )}>
                {formatMoney(item.session_avg)}
              </p>
            )}
            renderDrawerColumns={() => (
              <div className="grid border-b border-neutral-600 pb-2 grid-cols-3">
                <span className="text-muted">Name</span>
                <span className="text-muted">Rebuys Per</span>
                <span className="text-muted text-end">Avg Net</span>
              </div>
            )}
            renderDrawerRows={(item) => (
              <div
                className="w-full grid grid-cols-3 py-3 border-b border-neutral-600"
                key={`${item.member_id}-avg`}>
                <h3 className="text-base font-semibold md:text-xl">
                  <Link href={`/members/${item.member_id}`}>
                    {item.first_name}
                  </Link>
                </h3>
                <p className="font-semibold text-base md:text-lg">
                  {(item.avg_rebuys / item.sessions_played).toFixed(2)}
                </p>
                <p
                  className={cn(
                    "font-semibold text-base md:text-lg text-end",
                    getProfitTextColor(item.session_avg)
                  )}>
                  {formatMoney(item.session_avg)}
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default OverviewMobile;
