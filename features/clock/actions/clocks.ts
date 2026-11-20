"use server";

import { revalidatePath } from "next/cache";
import {
  type ClockRow,
  getClock,
  getServerNowMs,
  toClock,
} from "@/features/clock/data/clocks";
import { getStructure } from "@/features/clock/data/structures";
import {
  buildClockInsert,
  type ClockSettings,
  validateClockSettings,
} from "@/features/clock/lib/clocks";
import {
  type ClockControl,
  controlRefusalMessage,
  planControl,
} from "@/features/clock/lib/controls";
import type { StructureError } from "@/features/clock/lib/structures";
import { catchUpUpdate } from "@/features/clock/lib/timing";
import type { TournamentClock } from "@/features/clock/types";
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

// A control's outcome. clock is the saved row, so the screen can show it
// before the Realtime event arrives.
export type ClockControlResult = {
  success: boolean;
  message: string;
  clock?: TournamentClock;
};

const CLOCKS_PATH = "/admin/clock";
const CLOCK_GONE = "This clock no longer exists.";
const CHANGED_ELSEWHERE = "The clock changed on another screen. Try again.";
// A catch-up with nothing to do: another screen saved it, or the clock
// was paused or moved first. Not an error.
const NOTHING_TO_SAVE: ClockControlResult = { success: true, message: "" };
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
    return { success: false, message: CLOCK_GONE };
  }

  revalidatePath(CLOCKS_PATH);
  return { success: true, message: "Clock deleted." };
}

// The clock and the database's time, read together so the control works
// from the same moment every screen counts from.
async function loadClockAndTime(id: string) {
  const db = await createClient();
  const [{ data: clock, error }, nowMs] = await Promise.all([
    getClock(db, id),
    getServerNowMs(db),
  ]);
  return { db, clock, error, nowMs };
}

async function applyControl(
  id: string,
  control: ClockControl,
): Promise<ClockControlResult> {
  const { db, clock, error, nowMs } = await loadClockAndTime(id);
  if (error) return { success: false, message: error.message };
  if (!clock) return { success: false, message: CLOCK_GONE };

  const plan = planControl(clock, control, nowMs);
  if (!plan.ok) {
    return { success: false, message: controlRefusalMessage(plan.reason) };
  }

  // Saved only if no other screen has changed the status or level since
  // this clock was read.
  const { data, error: saveError } = await db
    .from("_tournament_clocks")
    .update(plan.value)
    .eq("id", id)
    .eq("status", clock.status)
    .eq("level_index", clock.level_index)
    .select()
    .maybeSingle();
  if (saveError) return { success: false, message: saveError.message };
  if (!data) return { success: false, message: CHANGED_ELSEWHERE };

  const saved = toClock(data as ClockRow);
  // The list shows each clock's status; screens get everything else over
  // Realtime.
  if (saved.status !== clock.status) revalidatePath(CLOCKS_PATH);
  return { success: true, message: "", clock: saved };
}

// Start, pause, resume, previous/next level or a minute more or less.
export async function controlClockAction(
  id: string,
  control: ClockControl,
): Promise<ClockControlResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await applyControl(id, control);
  } catch (error) {
    console.error("Error controlling tournament clock:", error);
    return { success: false, message: "Couldn't update the clock." };
  }
}

async function saveCatchUp(
  id: string,
  expectedLevelIndex: number,
): Promise<ClockControlResult> {
  const { db, clock, error, nowMs } = await loadClockAndTime(id);
  if (error) return { success: false, message: error.message };
  if (!clock) return { success: false, message: CLOCK_GONE };

  if (clock.level_index !== expectedLevelIndex) return NOTHING_TO_SAVE;
  const update = catchUpUpdate(clock, nowMs);
  if (!update) return NOTHING_TO_SAVE;

  const { data, error: saveError } = await db
    .from("_tournament_clocks")
    .update(update)
    .eq("id", id)
    .eq("status", "running")
    .eq("level_index", expectedLevelIndex)
    .select()
    .maybeSingle();
  if (saveError) return { success: false, message: saveError.message };
  return {
    success: true,
    message: "",
    clock: data ? toClock(data as ClockRow) : undefined,
  };
}

// Saves a level change that happened by time running out, once: the write
// only goes through while level_index is still expectedLevelIndex, so
// several admin screens open at once don't each save it.
export async function catchUpClockAction(
  id: string,
  expectedLevelIndex: number,
): Promise<ClockControlResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await saveCatchUp(id, expectedLevelIndex);
  } catch (error) {
    console.error("Error saving tournament clock level:", error);
    return { success: false, message: "Couldn't save the clock's level." };
  }
}
