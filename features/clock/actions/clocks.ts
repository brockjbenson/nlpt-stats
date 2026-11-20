"use server";

import { revalidatePath } from "next/cache";
import { getStructure } from "@/features/clock/data/structures";
import {
  buildClockInsert,
  type ClockSettings,
  validateClockSettings,
} from "@/features/clock/lib/clocks";
import type { StructureError } from "@/features/clock/lib/structures";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/user";

export type ClockActionResult = {
  success: boolean;
  message: string;
  // The new clock's id.
  id?: string;
  // Field problems, when the settings didn't pass validation.
  errors?: StructureError[];
};

const CLOCKS_PATH = "/admin/clock";
const NOT_ADMIN: ClockActionResult = {
  success: false,
  message: "Only admins can change tournament clocks.",
};

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin === true;
}

async function insertClock(
  structureId: string,
  settings: ClockSettings,
): Promise<ClockActionResult> {
  const errors = validateClockSettings(settings);
  if (errors.length > 0) {
    return { success: false, message: "Fix the highlighted fields.", errors };
  }

  const db = await createClient();
  const { data: structure, error: loadError } = await getStructure(
    db,
    structureId,
  );
  if (loadError) return { success: false, message: loadError.message };
  if (!structure) {
    return { success: false, message: "This template no longer exists." };
  }

  const { data, error } = await db
    .from("_tournament_clocks")
    .insert(buildClockInsert(structure, structure.levels, settings))
    .select("id")
    .single();
  if (error) return { success: false, message: error.message };

  revalidatePath(CLOCKS_PATH);
  return { success: true, message: "Clock created.", id: data.id as string };
}

// Makes a clock from a template with the settings from the create form.
// It starts in setup on the first level.
export async function createClockAction(
  structureId: string,
  settings: ClockSettings,
): Promise<ClockActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await insertClock(structureId, settings);
  } catch (error) {
    // Malformed settings from the client can throw in validation.
    console.error("Error creating tournament clock:", error);
    return { success: false, message: "Couldn't create this clock." };
  }
}

// Deletes a clock and its entrants.
export async function deleteClockAction(
  id: string,
): Promise<ClockActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;

  const db = await createClient();
  const { data, error } = await db
    .from("_tournament_clocks")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { success: false, message: error.message };
  if (!data || data.length === 0) {
    return { success: false, message: "This clock no longer exists." };
  }

  revalidatePath(CLOCKS_PATH);
  return { success: true, message: "Clock deleted." };
}
