import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import TournamentInfo from "@/components/stats/tournament/tournament-info-card";
import TournamentSessions from "@/components/stats/tournament/tournament-sessions";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

async function Page({ params }: Props) {
  const { id } = await params;
  const db = await createClient();
  const { data: majorData, error: majorError } = await db.rpc(
    "get_major_data",
    {
      target_tournament_id: id,
    }
  );

  if (majorError) {
    return (
      <ErrorHandler
        title="Error fetching Tournament data"
        errorMessage={majorError.message}
        pageTitle="Tournament"
      />
    );
  }

  return (
    <>
      <PageHeader title={"Tournament"} />
      <div className="w-full max-w-screen-xl mx-auto px-2">
        <h2 className="text-2xl w-full flex items-center justify-center my-8">
          {majorData.name}
        </h2>
        <TournamentInfo data={majorData} />
        <TournamentSessions data={majorData} />
      </div>
    </>
  );
}

export default Page;
