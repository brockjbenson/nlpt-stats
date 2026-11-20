"use server";

import { revalidatePath, updateTag } from "next/cache";
import { LEAGUE_DATA_TAG } from "@/lib/data/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/user";
import { refreshAfterTournamentSave } from "@/lib/data/refresh-after-tournament-save";
import { CashSessionNoId, TournamentSessionInput } from "@/utils/types";

// Postgres error code for a unique constraint violation.
const UNIQUE_VIOLATION = "23505";

type SessionActionResult = { success: boolean; message: string };

export const addSessionAction = async (
  sessions: CashSessionNoId[],
): Promise<SessionActionResult> => {
  const db = await createClient();

  const { error } = await db.from("cash_session").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  // Update rankings for all affected weeks
  const uniqueWeekIds = Array.from(new Set(sessions.map((s) => s.week_id)));

  for (const weekId of uniqueWeekIds) {
    const { error: rankingError } = await db.rpc(
      "insert_weekly_nlpi_rankings",
      { target_week_id: weekId },
    );

    if (rankingError) {
      console.error(
        `Failed to update rankings for week ${weekId}:`,
        rankingError,
      );
      // Continue anyway - sessions are already added
    }
  }

  // Clear cached league data, then revalidate specific pages
  updateTag(LEAGUE_DATA_TAG);
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page");
  revalidatePath("/members/[id]", "page");

  return { success: true, message: "Sessions added successfully" };
};

// Saves the results of members who played. Members who skipped get no row:
// the stats count them as 0 automatically. Buy-in, net profit and points are
// calculated by the database.
export const addTournamentSessionAction = async (
  sessions: TournamentSessionInput[],
): Promise<SessionActionResult> => {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { success: false, message: "Only admins can add sessions" };
  }

  const db = await createClient();
  const { error } = await db.from("_tournament_sessions").insert(sessions);

  if (error) {
    const message =
      error.code === UNIQUE_VIOLATION
        ? "A member already has a session in this tournament"
        : error.message;
    return { success: false, message };
  }

  // Tournament points count toward NLPI from the tournament's week.
  const tournamentIds = Array.from(
    new Set(sessions.map((session) => session.tournament_id)),
  );
  const { data: tournaments } = await db
    .from("_tournaments")
    .select("week_id")
    .in("id", tournamentIds);
  await refreshAfterTournamentSave(
    db,
    (tournaments ?? []).map((tournament) => tournament.week_id),
  );

  return { success: true, message: "Sessions added successfully" };
};
