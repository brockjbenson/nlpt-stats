"use client";

import { CareerStats } from "@/utils/types";
import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { OverviewStatCard } from "@/components/cashgames/overview-cards-mobile";

interface Props {
  careerStats: CareerStats[];
}
const OPTIONS: EmblaOptionsType = {};

function CareerOverview({ careerStats }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();

    emblaMainApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  const netProfitLeaders = [...careerStats].sort(
    (a, b) => b.net_profit - a.net_profit
  );
  const winsLeaders = [...careerStats].sort((a, b) => b.wins - a.wins);
  const grossProfitLeaders = [...careerStats].sort(
    (a, b) => b.gross_profit - a.gross_profit
  );
  const winPercentageLeaders = [...careerStats].sort(
    (a, b) => b.win_percentage - a.win_percentage
  );
  const sessionAverageLeaders = [...careerStats].sort(
    (a, b) => b.session_avg - a.session_avg
  );

  return (
    <div className="w-full pb-4 mx-auto block">
      <div className="mb-4 border-b pb-4 border-neutral-500">
        <div className="px-2 overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex flex-row -ml-4">
            <div className="flex-[0_0_min-content] pl-4">
              <button
                onClick={() => onThumbClick(0)}
                className={cn(
                  "flex w-full gap-1 items-center justify-center whitespace-nowrap ",
                  selectedIndex === 0 && "text-primary"
                )}>
                Wins
              </button>
            </div>
            <div className="flex-[0_0_min-content] pl-4">
              <button
                onClick={() => onThumbClick(1)}
                className={cn(
                  "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
                  selectedIndex === 1 && "text-primary"
                )}>
                Net Profit
              </button>
            </div>
            <div className="flex-[0_0_min-content] pl-4">
              <button
                onClick={() => onThumbClick(2)}
                className={cn(
                  "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
                  selectedIndex === 2 && "text-primary"
                )}>
                Gross Profit
              </button>
            </div>
            <div className="flex-[0_0_min-content] pl-4">
              <button
                onClick={() => onThumbClick(3)}
                className={cn(
                  "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
                  selectedIndex === 3 && "text-primary"
                )}>
                Win Percentage
              </button>
            </div>
            <div className="flex-[0_0_min-content] pl-4">
              <button
                onClick={() => onThumbClick(4)}
                className={cn(
                  "flex w-full gap-2 items-center justify-center whitespace-nowrap ",
                  selectedIndex === 4 && "text-primary"
                )}>
                Session Avg
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-2 overflow-hidden" ref={emblaMainRef}>
        <div className="flex touch-pan-y -ml-4">
          <OverviewStatCard
            title="Wins"
            data={winsLeaders}
            nameKey="first_name"
            valueKey="wins"
            sortFn={(a, b) => b.wins - a.wins}
          />
          <OverviewStatCard
            title="Net Profit"
            data={netProfitLeaders}
            nameKey="first_name"
            valueKey="net_profit"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.net_profit - a.net_profit}
          />
          <OverviewStatCard
            title="Gross Profit"
            data={grossProfitLeaders}
            nameKey="first_name"
            valueKey="gross_profit"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.gross_profit - a.gross_profit}
          />
          <OverviewStatCard
            title="Win Percentage"
            data={winPercentageLeaders}
            nameKey="first_name"
            valueKey="win_percentage"
            formatValue={(v) => `${v.toFixed(2)}%`}
            sortFn={(a, b) => b.win_percentage - a.win_percentage}
            extraColumns={[
              {
                label: "Sessions",
                render: (row) => row.sessions_played,
              },
            ]}
          />
          <OverviewStatCard
            title="Session Average"
            data={sessionAverageLeaders}
            nameKey="first_name"
            valueKey="session_avg"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.session_avg - a.session_avg}
            extraColumns={[
              {
                label: "Rebuys Per",
                render: (row) =>
                  (row.avg_rebuys / row.sessions_played).toFixed(2),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default CareerOverview;
