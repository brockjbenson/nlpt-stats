"use client";

import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

const OPTIONS: EmblaOptionsType = {};

interface Props {
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

function RecordsCarousel({ view, setView }: Props) {
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(OPTIONS);
  return (
    <div
      className="border-b-2 pb-2 border-white md:mt-4 overflow-hidden w-full"
      ref={emblaMainRef}>
      <ul className="flex touch-pan-y -ml-2">
        <li>
          <button
            className={`px-2 pb-2 text-xl ${view === "career" ? " text-white" : "text-neutral-400"}`}
            onClick={() => setView("career")}>
            Career
          </button>
        </li>
        <li>
          <button
            className={`px-2 pb-2 text-xl ${view === "season" ? " text-white" : "text-neutral-400"}`}
            onClick={() => setView("season")}>
            Season
          </button>
        </li>
      </ul>
    </div>
  );
}

export default RecordsCarousel;
