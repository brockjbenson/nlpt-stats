import { MajorsData } from "@/utils/types";
import TournamentCard from "./tournament-card";
import { AlertCircle } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import fetchTournamentsData from "../_lib/utils/fetch-data";
import ErrorHandler from "@/components/error-handler";

interface Props {
  year?: string;
}

async function TournamentsMain({ year }: Props) {
  const result = await fetchTournamentsData({ year });

  if (result.error) {
    return (
      <ErrorHandler
        title={result.title}
        errorMessage={result.error.message}
        pageTitle="Tournaments"
      />
    );
  }
  const { tournaments, members } = result;

  if (tournaments.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>No Tournaments Available</EmptyTitle>
          <EmptyDescription>
            No tournaments have been added for {year && year}. Once a tournament
            is added, it will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 px-2 pb-4 md:grid-cols-2 gap-4 md:gap-8">
        {tournaments.map((tournament: MajorsData) => (
          <TournamentCard
            members={members}
            data={tournament}
            key={tournament.id}
          />
        ))}
      </div>
    </>
  );
}

export default TournamentsMain;
