import ErrorHandler from "@/components/error-handler";
import StatsMain from "@/features/stats/components/main";
import { createClient } from "@/utils/supabase/server";

async function page() {
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
        pageTitle="Cumulative Stats"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Cumulative Stats"
      />
    );
  }

  const [{ data: stats, error: statsError }] = await Promise.all([
    db.rpc("get_career_stats", {
      target_view: "cumulative",
      target_season: "career", // ✅ Pass "career" or season_id as string
    }),
  ]);

  if (statsError) {
    return (
      <ErrorHandler
        title="Error fetching cumulative stats"
        errorMessage={statsError.message}
        pageTitle="Cumulative Stats"
      />
    );
  }

  return (
    <StatsMain
      view="cumulative"
      year="career"
      seasons={seasons}
      members={members}
      stats={stats}
      isCareer={true}
    />
  );
}

export default page;
