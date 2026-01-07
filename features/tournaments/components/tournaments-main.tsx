"use client";

import { MajorsData, Member } from "@/utils/types";
import TournamentCard from "./tournament-card";
import { AlertCircle } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface Props {
  tournamentsData: MajorsData[];
  members?: Member[];
}

function TournamentsMain({ tournamentsData, members }: Props) {
  const year = tournamentsData[0]?.season.year.toString();
  return (
    <>
      <div className="grid grid-cols-1 px-2 pb-4 md:grid-cols-2 gap-4 md:gap-8">
        {tournamentsData.length > 0 ? (
          tournamentsData.map((tournament: MajorsData) => (
            <TournamentCard
              members={members}
              data={tournament}
              key={tournament.id}
            />
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>No Tournaments Available</EmptyTitle>
              <EmptyDescription>
                No tournaments have been added for {year && year}. Once a
                tournament is added, it will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </>
  );
}

export default TournamentsMain;
