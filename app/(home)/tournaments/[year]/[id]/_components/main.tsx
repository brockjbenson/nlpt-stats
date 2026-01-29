import React from "react";
import fetchTournamentData from "../fetch-data";
import ErrorHandler from "@/components/error-handler";
import TournamentSessions from "./tournament-sessions";
import TournamentInfo from "./tournament-info-card";

async function TournamentMain({ id }: { id: string }) {
  const result = await fetchTournamentData({ id });

  if (result.error) {
    return (
      <ErrorHandler
        title={result.title}
        errorMessage={result.error.message}
        pageTitle="Tournament"
      />
    );
  }
  const { tournament } = result;
  return (
    <div className="w-full max-w-(--breakpoint-xl) mx-auto px-2">
      <h2 className="text-xl w-full flex items-center justify-center my-4">
        {tournament.name}
      </h2>
      <TournamentInfo data={tournament} />
      <TournamentSessions data={tournament} />
    </div>
  );
}

export default TournamentMain;
