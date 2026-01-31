import { StatsData } from "../types";
import { createClient } from "@/utils/supabase/server";
import { CashSession, Member, Season, Week } from "@/utils/types";
import { PostgrestError } from "@supabase/supabase-js";

type StatsDataSuccess = {
  seasons: Season[]; // Replace with actual Season type
  members: Member[]; // Replace with actual Member type
  stats: StatsData[]; // Replace with actual Stats type
  sessions: CashSession[]; // Replace with actual Session type
  weeks: Week[]; // Replace with actual Week type
  error?: never;
  title?: never;
};

type StatsDataError = {
  error: PostgrestError;
  title: string;
  seasons?: never;
  members?: never;
  stats?: never;
  sessions?: never;
  weeks?: never;
};

type StatsDataResult = StatsDataSuccess | StatsDataError;

export async function fetchStatsData(
  view: "cash" | "tournament" | "cumulative",
  year: string,
): Promise<StatsDataResult> {
  const db = await createClient();

  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*"),
  ]);

  if (seasonsError) {
    return { error: seasonsError, title: "Error fetching season" };
  }

  if (membersError) {
    return { error: membersError, title: "Error fetching members" };
  }

  const activeSeason = seasons.find(
    (season) => season.year.toString() === year,
  );

  const isCareerView = year === "career";

  // Build queries conditionally
  let cashSessionQuery = db.from("cash_session").select("*");
  let weekQuery = db.from("week").select("*");

  if (!isCareerView && activeSeason) {
    cashSessionQuery = cashSessionQuery.eq("season_id", activeSeason.id);
    weekQuery = weekQuery.eq("season_id", activeSeason.id);
  }

  // Fetch all data in parallel
  const [
    { data: stats, error: statsError },
    { data: sessions, error: sessionsError },
    { data: weeks, error: weeksError },
  ] = await Promise.all([
    db.rpc("get_career_stats", {
      target_view: view,
      target_season: activeSeason?.id ?? "career",
    }),
    cashSessionQuery,
    weekQuery,
  ]);

  if (statsError) {
    return { error: statsError, title: "Error fetching cash stats" };
  }

  if (sessionsError) {
    return { error: sessionsError, title: "Error fetching cash sessions" };
  }

  if (weeksError) {
    return { error: weeksError, title: "Error fetching weeks" };
  }

  return {
    seasons,
    members,
    stats: stats ?? [],
    sessions: sessions ?? [],
    weeks: weeks ?? [],
  };
}
