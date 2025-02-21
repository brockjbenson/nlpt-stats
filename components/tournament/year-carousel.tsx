"use client";

import { cn } from "@/lib/utils";
import { Season } from "@/utils/types";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import React from "react";

interface Props {
  seasons: Season[];
  year: string;
  isAdmin?: boolean;
}

const OPTIONS: EmblaOptionsType = {};

function YearCarousel({ seasons, year, isAdmin = false }: Props) {
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(OPTIONS);

  return (
    <div
      className="mb-4 border-b animate-in pb-4 border-neutral-500 px-2 overflow-hidden"
      ref={emblaMainRef}>
      <div className="flex touch-pan-y -ml-4">
        <Link
          style={{
            transform: "translate3D(0, 0, 0)",
          }}
          className={cn(
            "flex-[0_0_20%] flex items-center justify-center font-semibold min-w-0 pl-4"
          )}
          href={isAdmin ? `/admin/stats/tournaments` : `/stats/tournaments`}>
          <span
            className={cn(!year && "bg-primary px-3 py-1 text-white rounded")}>
            All
          </span>
        </Link>
        {seasons.map((season) => (
          <Link
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className={cn(
              "flex-[0_0_20%] flex items-center justify-center font-semibold min-w-0 pl-4"
            )}
            href={
              isAdmin
                ? `/admin/stats/tournaments?year=${season.year}`
                : `/stats/tournaments?year=${season.year}`
            }
            key={season.id + season.year}>
            <span
              className={cn(
                year === season.year.toString() &&
                  "bg-primary px-3 py-1 text-white rounded"
              )}>
              {season.year}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default YearCarousel;
