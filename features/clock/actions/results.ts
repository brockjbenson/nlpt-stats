"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/features/clock/actions/is-admin";
import {
  type FinishForm,
  type FinishFormError,
  finishFormToSave,
  validateFinishForm,
} from "@/features/clock/lib/finish-form";
import {
  CLOCKS_PATH,
  clockControlPath,
  clockFinishPath,
} from "@/features/clock/lib/paths";
import { refreshAfterTournamentSave } from "@/lib/data/refresh-after-tournament-save";
import { createClient } from "@/utils/supabase/server";

export type SaveResultsResult = {
  success: boolean;
  message: string;
  // The saved tournament.
  tournamentId?: string;
  // Field problems, when the form didn't pass validation.
  errors?: FinishFormError[];
};

// Postgres error codes save_clock_results can raise.
const NO_DATA_FOUND = "P0002";
const UNIQUE_VIOLATION = "23505";

function saveErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === NO_DATA_FOUND) {
    return "This clock isn't finished or no longer exists.";
  }
  if (error.code === UNIQUE_VIOLATION) {
    return "A member is listed twice.";
  }
  return error.message;
}

// The week the clock's results were saved under before, if any: re-saving
// can move the tournament to another week, and both weeks' rankings change.
async function previousWeekId(
  db: SupabaseClient,
  clockId: string,
): Promise<string | null> {
  const { data } = await db
    .from("_tournament_clocks")
    .select("tournament:_tournaments(week_id)")
    .eq("id", clockId)
    .maybeSingle();
  const tournament = (data as { tournament: { week_id: string } | null } | null)
    ?.tournament;
  return tournament?.week_id ?? null;
}

async function saveResults(
  clockId: string,
  form: FinishForm,
): Promise<SaveResultsResult> {
  const errors = validateFinishForm(form);
  if (errors.length > 0) {
    return { success: false, message: "Fix the highlighted fields.", errors };
  }

  const db = await createClient();
  const earlierWeekId = await previousWeekId(db, clockId);
  const { tournament, sessions } = finishFormToSave(form);
  const { data, error } = await db.rpc("save_clock_results", {
    p_clock_id: clockId,
    p_tournament: tournament,
    p_sessions: sessions,
  });
  if (error) return { success: false, message: saveErrorMessage(error) };

  await refreshAfterTournamentSave(
    db,
    earlierWeekId ? [tournament.week_id, earlierWeekId] : [tournament.week_id],
  );
  revalidatePath(CLOCKS_PATH);
  revalidatePath(clockControlPath(clockId));
  revalidatePath(clockFinishPath(clockId));

  return {
    success: true,
    message: earlierWeekId ? "Results updated." : "Results saved.",
    tournamentId: data as string,
  };
}

// Saves a finished clock's results as a tournament and its members'
// sessions (or, saved before, updates them), then refreshes rankings and
// league pages the way manual entry does.
export async function saveClockResultsAction(
  clockId: string,
  form: FinishForm,
): Promise<SaveResultsResult> {
  if (!(await isAdmin())) {
    return { success: false, message: "Only admins can save results." };
  }
  try {
    return await saveResults(clockId, form);
  } catch (error) {
    // Malformed input from the client can throw in validation.
    console.error("Error saving clock results:", error);
    return { success: false, message: "Couldn't save the results." };
  }
}
