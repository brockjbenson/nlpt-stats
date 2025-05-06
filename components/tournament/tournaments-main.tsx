"use client";

import { MajorsData, Season } from "@/utils/types";
import React from "react";
import YearCarousel from "./year-carousel";
import TournamentCard from "./tournament-card";
import Link from "next/link";
import { Card } from "../ui/card";
import { PlusCircle } from "lucide-react";

interface Props {
  tournamentsData: MajorsData[];
  seasons: Season[];
  isAdmin?: boolean;
}

function TournamentsMain({ tournamentsData, seasons, isAdmin }: Props) {
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
        {isAdmin && (
          <Card>
            <Link
              className="w-full flex items-center font-semibold justify-between"
              href={"/admin/stats/tournaments/new"}>
              New Tournament
              <PlusCircle className="text-primary" />
            </Link>
          </Card>
        )}
        {tournamentsToShow.map((tournament: MajorsData) => (
          <TournamentCard data={tournament} key={tournament.id} />
        ))}
      </div>
    </>
  );
}

export default TournamentsMain;
