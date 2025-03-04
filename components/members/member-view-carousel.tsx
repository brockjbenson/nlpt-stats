"use client";

import { cn } from "@/lib/utils";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

interface Props {
  view: string;
  setView: (view: string) => void;
}
const OPTIONS: EmblaOptionsType = {};
function MemberViewCarousel({ view, setView }: Props) {
  const [emblaMainRef] = useEmblaCarousel(OPTIONS);
  return (
    <div
      className="px-2 relative border-b-[3px] border-neutral-700 overflow-hidden"
      ref={emblaMainRef}>
      <ul className="flex touch-pan-y items-center justify-start">
        <li
          style={{
            transform: "translate3D(0, 0, 0)",
          }}
          onClick={() => setView("overview")}
          className={cn(
            "w-fit px-2 mr-2 z-20 py-3 flex items-center justify-center"
          )}>
          <span
            className={cn(
              "font-semibold",
              view === "overview" || view === undefined
                ? "text-primary"
                : "text-muted"
            )}>
            Overview
          </span>
        </li>
        <li
          style={{
            transform: "translate3D(0, 0, 0)",
          }}
          onClick={() => setView("cash")}
          className={cn(
            "w-fit px-2 mr-2 z-20 py-3 flex items-center justify-center"
          )}>
          <span
            className={cn(
              "font-semibold",
              view === "cash" ? "text-primary" : "text-muted"
            )}>
            Cash
          </span>
        </li>
        <li
          style={{
            transform: "translate3D(0, 0, 0)",
          }}
          onClick={() => setView("majors")}
          className={cn(
            "w-fit px-2 mr-2 z-20 py-3 flex items-center justify-center"
          )}>
          <span
            className={cn(
              "font-semibold",
              view === "majors" ? "text-primary" : "text-muted"
            )}>
            Majors
          </span>
        </li>
      </ul>
    </div>
  );
}

export default MemberViewCarousel;
