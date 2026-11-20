import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  SavedSession,
  SavedTournament,
} from "@/features/clock/lib/finish-form";

// A tournament saved from a clock, with its sessions. data null when the
// tournament no longer exists.
export async function getSavedResults(
  db: SupabaseClient,
  tournamentId: string,
): Promise<
  | {
      data: { tournament: SavedTournament; sessions: SavedSession[] } | null;
      error: null;
    }
  | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_tournaments")
    .select(
      "name, date, week_id, places_paid, buy_in_amount, rebuy_amount, player_count, total_rebuys, sessions:_tournament_sessions(member_id, rebuys, cash_out, place)",
    )
    .eq("id", tournamentId)
    .maybeSingle();
  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };
  const { sessions, ...tournament } = data as SavedTournament & {
    sessions: SavedSession[];
  };
  return { data: { tournament, sessions }, error: null };
}
