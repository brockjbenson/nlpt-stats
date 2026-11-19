import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { MajorsData, Tournament, TournamentSession } from "@/utils/types";

type TournamentsResult =
  | { data: MajorsData[]; error: null }
  | { data: null; error: PostgrestError };

// Tournaments with their members' results, for one season or every season
// when seasonId is null. Returns a Supabase-style { data, error }, so it works
// with must() in lib/data/league.ts and directly in admin pages.
//
// Two queries rather than an embedded select: PostgREST doesn't reliably
// embed one view in another.
export async function selectTournamentsWithSessions(
  db: SupabaseClient,
  seasonId: string | null,
): Promise<TournamentsResult> {
  const summaries = db.from("_tournament_summaries").select("*");
  const { data: tournaments, error } = await (seasonId
    ? summaries.eq("season_id", seasonId)
    : summaries);
  if (error) return { data: null, error };
  if (tournaments.length === 0) return { data: [], error: null };

  const { data: sessions, error: sessionsError } = await db
    .from("_tournament_session_points")
    .select("*")
    .in(
      "tournament_id",
      tournaments.map((tournament: Tournament) => tournament.id),
    );
  if (sessionsError) return { data: null, error: sessionsError };

  const sessionsByTournament = groupByTournament(sessions);
  return {
    data: tournaments.map((tournament: Tournament) => ({
      ...tournament,
      sessions: sessionsByTournament.get(tournament.id) ?? [],
    })),
    error: null,
  };
}

function groupByTournament(
  sessions: TournamentSession[],
): Map<string, TournamentSession[]> {
  const grouped = new Map<string, TournamentSession[]>();
  for (const session of sessions) {
    const group = grouped.get(session.tournament_id) ?? [];
    group.push(session);
    grouped.set(session.tournament_id, group);
  }
  return grouped;
}
