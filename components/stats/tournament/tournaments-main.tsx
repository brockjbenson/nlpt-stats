"use client";

import { MajorsData, Season } from "@/utils/types";
import React from "react";
import YearCarousel from "./year-carousel";
import TournamentCard from "./tournament-card";
import Link from "next/link";
import { Card } from "../../ui/card";
import { ChevronDown, PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "../../ui/select";
import { cn } from "@/lib/utils";

interface Props {
  tournamentsData: MajorsData[];
  seasons: Season[];
  isAdmin?: boolean;
}

function TournamentsMain({ tournamentsData, seasons, isAdmin }: Props) {
  const [open, setOpen] = React.useState(false);
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
      <div className="my-8 md:flex items-center justify-between hidden px-2">
        <h1 className="text-2xl font-semibold">
          {view === "all" ? "All" : view} Tournaments
        </h1>
        <Select onOpenChange={setOpen} open={open}>
          <SelectTrigger
            className={cn(
              "bg-transparent border-b m-0 border-b-neutral-500 py-3 rounded-none h-fit items-center gap-1 text-xl font-bold w-fit"
            )}>
            {view === "all" ? "All" : view}
            <ChevronDown className={cn("w-6 h-6 ml-2", open && "rotate-180")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup className="flex w-full flex-col">
              <div className="flex w-full flex-col">
                <button
                  onClick={() => {
                    setOpen(false);
                    setView("all");
                  }}
                  key={"all"}
                  className="w-full py-2 pl-2 text-left pr-4 hover:bg-neutral-800">
                  All
                </button>
                {seasons.map((season) => (
                  <button
                    onClick={() => {
                      setOpen(false);
                      setView(season.year.toString());
                    }}
                    key={season.id + season.year}
                    className="w-full py-2 text-left pl-2 pr-4 hover:bg-neutral-800">
                    {season.year}
                  </button>
                ))}
              </div>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <YearCarousel seasons={seasons} view={view} setView={setView} />
      <div className="grid grid-cols-1 px-2 pb-4 md:grid-cols-3 gap-4 md:gap-8">
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
