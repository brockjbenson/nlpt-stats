import { StatsData } from "../types";
import {
  getCareerStats,
  getCashSessions,
  getMembers,
  getSeasons,
  getWeeks,
} from "@/lib/data/league";
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
  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([getSeasons(), getMembers()]);

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

  // One season's sessions and weeks, or all of them for career
  const seasonId = !isCareerView && activeSeason ? activeSeason.id : null;

  // Fetch all data in parallel
  const [
    { data: stats, error: statsError },
    { data: sessions, error: sessionsError },
    { data: weeks, error: weeksError },
  ] = await Promise.all([
    getCareerStats(view, activeSeason?.id ?? "career"),
    getCashSessions(seasonId),
    getWeeks(seasonId),
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
