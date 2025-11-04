"use client";

import {
  CashSession,
  Member,
  POYData,
  SeasonCashStats,
  Week,
} from "@/utils/types";
import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { Card, CardTitle } from "@/components/ui/card";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";
import OverviewThumbs from "./overview-thumbs";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { OverviewStatCard } from "./overview-cards-mobile";

interface Props {
  seasonStats: SeasonCashStats[];
  poyData: POYData[];
  members: Member[];
}
const OPTIONS: EmblaOptionsType = {};

function OverviewMobile({ seasonStats, poyData, members }: Props) {
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

  const poyPointsLeaders = [...seasonStats].sort(
    (a, b) => b.poy_points - a.poy_points
  );
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

  return (
    <div className="w-full pb-4 mx-auto md:hidden block">
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
      <div className="px-2 overflow-hidden" ref={emblaMainRef}>
        <div className="flex touch-pan-y -ml-4">
          <OverviewStatCard
            title="POY Points"
            description="(Cash games only)"
            data={poyPointsLeaders}
            nameKey="first_name"
            valueKey="poy_points"
            formatValue={(v) => v.toFixed(2)}
            sortFn={(a, b) => b.poy_points - a.poy_points}
          />
          <OverviewStatCard
            title="Wins"
            data={seasonStats}
            nameKey="first_name"
            valueKey="wins"
            sortFn={(a, b) => b.wins - a.wins}
          />

          <OverviewStatCard
            title="Net Profit"
            data={seasonStats}
            nameKey="first_name"
            valueKey="net_profit"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.net_profit - a.net_profit}
          />
          <OverviewStatCard
            title="Gross Profit"
            data={seasonStats}
            nameKey="first_name"
            valueKey="gross_profit"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.gross_profit - a.gross_profit}
          />

          <OverviewStatCard
            title="Win Percentage"
            data={seasonStats}
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
            data={seasonStats}
            nameKey="first_name"
            valueKey="session_avg"
            formatValue={(v) => formatMoney(v)}
            valueTextColorFn={(v) => getProfitTextColor(v)}
            sortFn={(a, b) => b.session_avg - a.session_avg}
          />
        </div>
      </div>
    </div>
  );
}

export default OverviewMobile;
