"use client";

import { MajorsData, Season } from "@/utils/types";
import React from "react";
import TournamentCard from "./tournament-card";
import { AlertCircle, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface Props {
  tournamentsData: MajorsData[];
  seasons: Season[];
}

function TournamentsMain({ tournamentsData, seasons }: Props) {
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
      <div className="flex items-center justify-end md:justify-between px-2">
        <h1 className="text-xl hidden md:block font-semibold">
          {view === "all" ? "All" : view} Tournaments
        </h1>
        <Select defaultValue="all" onOpenChange={setOpen} open={open}>
          <SelectTrigger variant="outline" className="w-fit h-fit mb-4">
            <SelectValue placeholder="All" />
            <ChevronDown className={cn("w-6 h-6 ml-2", open && "rotate-180")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup className="flex w-full flex-col">
              <SelectItem
                defaultChecked
                onClick={() => {
                  setOpen(false);
                  setView("all");
                }}
                value="all">
                All
              </SelectItem>

              {seasons.map((season) => (
                <SelectItem
                  onClick={() => {
                    setOpen(false);
                    setView(season.year.toString());
                  }}
                  value={season.year.toString()}
                  key={season.id + season.year}>
                  {season.year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 px-2 pb-4 md:grid-cols-2 gap-4 md:gap-8">
        {tournamentsToShow.length > 0 ? (
          tournamentsToShow.map((tournament: MajorsData) => (
            <TournamentCard data={tournament} key={tournament.id} />
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>No Tournaments Available</EmptyTitle>
              <EmptyDescription>
                No tournaments have been added for {view}. Please check back
                later.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </>
  );
}

export default TournamentsMain;
