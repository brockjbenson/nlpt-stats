"use client";

import { cn } from "@/lib/utils";
import { Season } from "@/utils/types";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

interface Props {
  seasons: Season[];
  view: string;
  isAdmin?: boolean;
  setView: (view: string) => void;
}

const OPTIONS: EmblaOptionsType = {};

function YearCarousel({ seasons, view, setView, isAdmin = false }: Props) {
  const [emblaMainRef] = useEmblaCarousel(OPTIONS);

  return (
    <div
      className="mb-4 border-b  pb-4 border-neutral-500 px-2 overflow-hidden"
      ref={emblaMainRef}>
      <div className="flex touch-pan-y -ml-4">
        <div
          style={{
            transform: "translate3D(0, 0, 0)",
          }}
          className={cn(
            "flex-[0_0_20%] flex items-center justify-center font-semibold min-w-0 pl-4"
          )}>
          <button
            onClick={() => setView("all")}
            className={cn(
              view === "all" && "bg-primary px-3 py-1 text-white rounded"
            )}>
            All
          </button>
        </div>
        {seasons.map((season) => (
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className={cn(
              "flex-[0_0_20%] flex items-center justify-center font-semibold min-w-0 pl-4"
            )}
            key={season.id + season.year}>
            <button
              onClick={() => setView(season.year.toString())}
              className={cn(
                view === season.year.toString() &&
                  "bg-primary px-3 py-1 text-white rounded"
              )}>
              {season.year}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YearCarousel;
