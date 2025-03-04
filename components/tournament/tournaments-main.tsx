"use client";

import { MajorsData, Season } from "@/utils/types";
import React from "react";
import YearCarousel from "./year-carousel";
import TournamentCard from "./tournament-card";

interface Props {
  tournamentsData: MajorsData[];
  seasons: Season[];
}

function TournamentsMain({ tournamentsData, seasons }: Props) {
  const [view, setView] = React.useState<string>("all");
  const tournamentsToShow =
    view === "all"
      ? tournamentsData
      : tournamentsData.filter(
          (tournament) =>
            new Date(tournament.date).getFullYear().toString() === view
        );

  return (
    <>
      <YearCarousel seasons={seasons} view={view} setView={setView} />
      <div className="grid grid-cols-1 px-2 pb-4 md:grid-cols-3 gap-4">
        {tournamentsToShow.map((tournament: MajorsData) => (
          <TournamentCard data={tournament} key={tournament.id} />
        ))}
      </div>
    </>
  );
}

export default TournamentsMain;
