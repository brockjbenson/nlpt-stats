import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import TournamentInfo from "@/features/tournaments/components/tournament-info-card";
import TournamentSessions from "@/features/tournaments/components/tournament-sessions";
import { createStaticClient } from "@/utils/supabase/static";

interface Props {
  params: Promise<{ year: string; id: string }>;
}

export async function generateStaticParams() {
  const db = createStaticClient();
  const { data: tournaments } = await db
    .from("tournaments")
    .select("id, season_id");
  const { data: seasons } = await db.from("season").select("year, id");

  if (!seasons) {
    return [];
  }

  if (!tournaments) {
    return [];
  }

  return tournaments.map((tournament) => ({
    year:
      seasons
        .find((season) => season.id === tournament.season_id)
        ?.year.toString() || "",
    id: tournament.id.toString(),
  }));
}

export const dynamic = "force-static";

async function Page({ params }: Props) {
  const { id } = await params;
  const db = createStaticClient();
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
      <PageHeader title={"Tournament"} showBackButton />
      <div className="w-full max-w-(--breakpoint-xl) mx-auto px-2">
        <h2 className="text-xl w-full flex items-center justify-center my-4">
          {majorData.name}
        </h2>
        <TournamentInfo data={majorData} />
        <TournamentSessions data={majorData} />
      </div>
    </>
  );
}

export default Page;
