import ErrorHandler from "@/components/error-handler";
import StatsMain from "@/features/stats/components/main";
import { createStaticClient } from "@/utils/supabase/static";

export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour (optional)

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

export async function generateStaticParams() {
  // Use service role client for static generation
  const db = createStaticClient();
  const { data: seasons } = await db.from("season").select("year");

  return (
    seasons?.map((season) => ({
      year: season.year.toString(),
    })) ?? []
  );
}

async function page({ params }: PageProps) {
  const { year } = await params;
  const db = createStaticClient();

  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*"),
  ]);

  if (seasonsError) {
    return (
      <ErrorHandler
        title="Error fetching season"
        errorMessage={seasonsError.message}
        pageTitle="Tournament Stats"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Tournament Stats"
      />
    );
  }

  const activeSeason = seasons.find(
    (season) => season.year.toString() === year
  );

  const [{ data: stats, error: statsError }] = await Promise.all([
    db.rpc("get_career_stats", {
      target_view: "tournament",
      target_season: activeSeason?.id, // ✅ Pass "career" or season_id as string
    }),
  ]);

  if (statsError) {
    return (
      <ErrorHandler
        title="Error fetching tournament stats"
        errorMessage={statsError.message}
        pageTitle="Tournament Stats"
      />
    );
  }

  return (
    <StatsMain
      view="tournament"
      year={year}
      seasons={seasons}
      members={members}
      stats={stats}
      isCareer={false}
    />
  );
}

export default page;
