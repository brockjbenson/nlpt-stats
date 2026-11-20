import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, updateTag } from "next/cache";
import { LEAGUE_DATA_TAG } from "@/lib/data/cache";

// After saving a tournament's results (manual entry or a finished clock):
// tournament points count toward NLPI from the tournament's week, so each
// week's rankings are recalculated; then cached league data is cleared and
// the pages that show it revalidated. Call from a server action.
export async function refreshAfterTournamentSave(
  db: SupabaseClient,
  weekIds: string[],
): Promise<void> {
  for (const weekId of Array.from(new Set(weekIds))) {
    const { error } = await db.rpc("insert_weekly_nlpi_rankings", {
      target_week_id: weekId,
    });
    if (error) {
      // The results are saved; rankings catch up on the week's next save.
      console.error(`Failed to update rankings for week ${weekId}:`, error);
    }
  }

  updateTag(LEAGUE_DATA_TAG);
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page");
  revalidatePath("/members/[id]", "page");
  revalidatePath("/tournaments", "layout");
}
