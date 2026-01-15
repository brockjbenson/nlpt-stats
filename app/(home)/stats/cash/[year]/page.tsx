import ErrorHandler from "@/components/error-handler";
import StatsMain from "@/features/stats/components/main";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

async function page({ params }: PageProps) {
  const { year } = await params;
  const db = await createClient();

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
        pageTitle="Cash Stats"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Cash Stats"
      />
    );
  }

  const activeSeason = seasons.find(
    (season) => season.year.toString() === year
  );

  const [
    { data: stats, error: statsError },
    { data: sessions, error: sessionsError },
    { data: weeks, error: weeksError },
  ] = await Promise.all([
    db.rpc("get_career_stats", {
      target_view: "cash",
      target_season: activeSeason?.id, // ✅ Pass "career" or season_id as string
    }),
    db.from("cash_session").select("*").eq("season_id", activeSeason?.id),
    db.from("week").select("*").eq("season_id", activeSeason?.id),
  ]);

  if (sessionsError) {
    return (
      <ErrorHandler
        title="Error fetching cash sessions"
        errorMessage={sessionsError.message}
        pageTitle="Cash Stats"
      />
    );
  }

  if (weeksError) {
    return (
      <ErrorHandler
        title="Error fetching weeks"
        errorMessage={weeksError.message}
        pageTitle="Cash Stats"
      />
    );
  }

  if (statsError) {
    return (
      <ErrorHandler
        title="Error fetching cash stats"
        errorMessage={statsError.message}
        pageTitle="Cash Stats"
      />
    );
  }

  return (
    <StatsMain
      view="cash"
      year={year}
      weeks={weeks}
      sessions={sessions}
      seasons={seasons}
      members={members}
      stats={stats}
      isCareer={false}
    />
  );
}

export default page;
