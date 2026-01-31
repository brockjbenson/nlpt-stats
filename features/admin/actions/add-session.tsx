"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { SessionNoId } from "@/utils/tournament/utils";
import { CashSessionNoId } from "@/utils/types";

export const addSessionAction = async (sessions: CashSessionNoId[]) => {
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

  // Revalidate specific pages
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page");
  revalidatePath("/members/[id]", "page");

  return { success: true, message: "Sessions added successfully" };
};

export const addTournamentSessionAction = async (sessions: SessionNoId[]) => {
  const db = await createClient();

  const { error } = await db.from("tournament_sessions").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  // Update rankings for all affected weeks
  // Tournament sessions affect weeks through the tournament's date
  // You'll need to fetch the tournament data to get the week_id
  const tournamentIds = Array.from(
    new Set(sessions.map((s) => s.tournament_id)),
  );

  const { data: tournaments } = await db
    .from("tournaments")
    .select("id, week_id")
    .in("id", tournamentIds);

  if (tournaments) {
    const uniqueWeekIds = Array.from(
      new Set(tournaments.map((t) => t.week_id).filter(Boolean)),
    );

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
      }
    }
  }

  // Revalidate specific pages
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page");
  revalidatePath("/members/[id]", "page");

  return { success: true, message: "Sessions added successfully" };
};
