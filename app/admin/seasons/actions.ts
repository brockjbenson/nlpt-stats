"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSeason(year: number, numWeeks: number) {
  const db = await createClient();

  try {
    // Insert the season
    const response = await db.from("season").insert({ year }).select();

    if (response.error) {
      return { error: response.error.message };
    }

    const seasonId = response.data?.[0]?.id;

    if (!seasonId) {
      return { error: "Failed to create season" };
    }

    // Insert the weeks
    const weeksToInsert = Array.from({ length: numWeeks }, (_, i) => ({
      season_id: seasonId,
      week_number: i + 1,
    }));

    const weeksResponse = await db.from("week").insert(weeksToInsert);

    if (weeksResponse.error) {
      return { error: weeksResponse.error.message };
    }

    // Revalidate the seasons page
    revalidatePath("/admin/seasons");

    return { success: true };
  } catch (error) {
    console.error("Error creating season:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateSeason(
  seasonId: string,
  year: number,
  numWeeks: number,
  confirmDelete: boolean = false
): Promise<
  | { success: true }
  | { error: string }
  | { requiresConfirmation: true; affectedSessions: number }
> {
  // Validation
  if (!seasonId?.trim()) {
    return { error: "Season ID is required" };
  }
  if (year < 1900 || year > 2100) {
    return { error: "Year must be between 1900 and 2100" };
  }
  if (numWeeks < 1 || numWeeks > 100) {
    return { error: "Number of weeks must be between 1 and 100" };
  }

  const db = await createClient();

  try {
    // Update season year
    const { error: updateError } = await db
      .from("season")
      .update({ year })
      .eq("id", seasonId);

    if (updateError) {
      return { error: `Failed to update season: ${updateError.message}` };
    }

    // Get current week count
    const { count: existingWeekCount, error: countError } = await db
      .from("week")
      .select("*", { count: "exact", head: true })
      .eq("season_id", seasonId);

    if (countError) {
      return { error: `Failed to fetch weeks: ${countError.message}` };
    }

    const currentCount = existingWeekCount ?? 0;

    if (numWeeks > currentCount) {
      // Add new weeks
      const weeksToAdd = Array.from(
        { length: numWeeks - currentCount },
        (_, i) => ({
          season_id: seasonId,
          week_number: currentCount + i + 1,
        })
      );

      const { error: insertError } = await db.from("week").insert(weeksToAdd);

      if (insertError) {
        return { error: `Failed to add weeks: ${insertError.message}` };
      }
    } else if (numWeeks < currentCount) {
      // Get the weeks that will be deleted
      const { data: weeksToDelete, error: weeksError } = await db
        .from("week")
        .select("id")
        .eq("season_id", seasonId)
        .gt("week_number", numWeeks);

      if (weeksError) {
        return { error: `Failed to fetch weeks: ${weeksError.message}` };
      }

      if (!weeksToDelete || weeksToDelete.length === 0) {
        // No weeks to delete
        revalidatePath("/admin/seasons");
        return { success: true };
      }

      const weekIds = weeksToDelete.map((w) => w.id);

      // Check if any sessions exist for these weeks
      const { count: sessionCount, error: sessionError } = await db
        .from("cash_session")
        .select("*", { count: "exact", head: true })
        .in("week_id", weekIds);

      if (sessionError) {
        return { error: `Failed to check sessions: ${sessionError.message}` };
      }

      // If sessions exist and user hasn't confirmed, ask for confirmation
      if (sessionCount && sessionCount > 0 && !confirmDelete) {
        return {
          requiresConfirmation: true,
          affectedSessions: sessionCount,
        };
      }

      // If confirmed, delete sessions first
      if (confirmDelete && sessionCount && sessionCount > 0) {
        const { error: deleteSessionsError } = await db
          .from("cash_session")
          .delete()
          .in("week_id", weekIds);

        if (deleteSessionsError) {
          return {
            error: `Failed to delete sessions: ${deleteSessionsError.message}`,
          };
        }
      }

      // Now remove the weeks
      const { error: deleteError } = await db
        .from("week")
        .delete()
        .eq("season_id", seasonId)
        .gt("week_number", numWeeks);

      if (deleteError) {
        return { error: `Failed to remove weeks: ${deleteError.message}` };
      }
    }

    revalidatePath("/admin/seasons");
    return { success: true };
  } catch (error) {
    console.error("Error updating season:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteSeason(
  seasonId: string,
  confirmDelete: boolean = false
): Promise<
  | { success: true }
  | { error: string }
  | {
      requiresConfirmation: true;
      affectedWeeks: number;
      affectedSessions: number;
    }
> {
  // Validation
  if (!seasonId?.trim()) {
    return { error: "Season ID is required" };
  }

  const db = await createClient();

  try {
    // Get all weeks for this season
    const { data: weeks, error: weeksError } = await db
      .from("week")
      .select("id")
      .eq("season_id", seasonId);

    if (weeksError) {
      return { error: `Failed to fetch weeks: ${weeksError.message}` };
    }

    const weekCount = weeks?.length ?? 0;

    if (weekCount > 0) {
      const weekIds = weeks.map((w) => w.id);

      // Check if any sessions exist for these weeks
      const { count: sessionCount, error: sessionError } = await db
        .from("cash_session")
        .select("*", { count: "exact", head: true })
        .in("week_id", weekIds);

      if (sessionError) {
        return { error: `Failed to check sessions: ${sessionError.message}` };
      }

      // If weeks/sessions exist and user hasn't confirmed, ask for confirmation
      if (!confirmDelete) {
        return {
          requiresConfirmation: true,
          affectedWeeks: weekCount,
          affectedSessions: sessionCount ?? 0,
        };
      }

      // If confirmed, delete sessions first
      if (sessionCount && sessionCount > 0) {
        const { error: deleteSessionsError } = await db
          .from("cash_session")
          .delete()
          .in("week_id", weekIds);

        if (deleteSessionsError) {
          return {
            error: `Failed to delete sessions: ${deleteSessionsError.message}`,
          };
        }
      }

      // Delete all weeks for this season
      const { error: deleteWeeksError } = await db
        .from("week")
        .delete()
        .eq("season_id", seasonId);

      if (deleteWeeksError) {
        return {
          error: `Failed to delete weeks: ${deleteWeeksError.message}`,
        };
      }
    }

    // Finally, delete the season itself
    const { error: deleteSeasonError } = await db
      .from("season")
      .delete()
      .eq("id", seasonId);

    if (deleteSeasonError) {
      return {
        error: `Failed to delete season: ${deleteSeasonError.message}`,
      };
    }

    revalidatePath("/admin/seasons");
    return { success: true };
  } catch (error) {
    console.error("Error deleting season:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
