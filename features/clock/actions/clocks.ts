"use server";

import { revalidatePath, updateTag } from "next/cache";
import { LEAGUE_DATA_TAG } from "@/lib/data/cache";
import {
  type ClockRow,
  getClock,
  getServerNowMs,
  toClock,
} from "@/features/clock/data/clocks";
import { getClockPlayers } from "@/features/clock/data/entrants";
import { getStructure } from "@/features/clock/data/structures";
import {
  buildClockInsert,
  type ClockDetails,
  type ClockSettings,
  validateClockDetails,
  validateClockSettings,
} from "@/features/clock/lib/clocks";
import {
  type ClockControl,
  controlRefusalMessage,
  planControl,
} from "@/features/clock/lib/controls";
import {
  finishRefusalMessage,
  planFinishClock,
} from "@/features/clock/lib/finish";
import {
  type LevelEditRefusal,
  planLevelEdit,
} from "@/features/clock/lib/level-edits";
import { CLOCKS_PATH } from "@/features/clock/lib/paths";
import type { StructureError } from "@/features/clock/lib/structures";
import { catchUpUpdate } from "@/features/clock/lib/timing";
import type {
  BlindLevel,
  ClockEntrant,
  TournamentClock,
} from "@/features/clock/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/features/clock/actions/is-admin";
import { createClient } from "@/utils/supabase/server";

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

// The outcome of saving a clock's details. clock is the saved row, so the
// screen can show it before the Realtime event arrives.
export type ClockSettingsActionResult = {
  success: boolean;
  message: string;
  clock?: TournamentClock;
  errors?: StructureError[];
};

const CLOCK_GONE = "This clock no longer exists.";
const CHANGED_ELSEWHERE = "The clock changed on another screen. Try again.";
// A catch-up with nothing to do: another screen saved it, or the clock
// was paused or moved first. Not an error.
const NOTHING_TO_SAVE: ClockControlResult = { success: true, message: "" };
const NOT_ADMIN: ClockActionResult = {
  success: false,
  message: "Only admins can change tournament clocks.",
};

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
    .select("id, tournament_id");
  if (error) return { success: false, message: error.message };
  if (!data || data.length === 0) {
    return { success: false, message: CLOCK_GONE };
  }

  // Its tournament's page links to it; refresh that so the link goes.
  if (data[0].tournament_id) updateTag(LEAGUE_DATA_TAG);
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

// Finishing or reopening: the saved clock and its players, so the screen
// shows both before their Realtime events arrive.
export type ClockFinishResult = ClockControlResult & {
  entrants?: ClockEntrant[];
};

// Postgres error code the finish functions raise when the clock or its
// players changed first.
const NO_DATA_FOUND = "P0002";

async function savedClockAndPlayers(
  db: SupabaseClient,
  row: ClockRow,
  message: string,
): Promise<ClockFinishResult> {
  revalidatePath(CLOCKS_PATH);
  const { data } = await getClockPlayers(db, row.id);
  return {
    success: true,
    message,
    clock: toClock(row),
    entrants: data?.entrants,
  };
}

async function finishClock(id: string): Promise<ClockFinishResult> {
  const db = await createClient();
  const [{ data: clock, error }, players, nowMs] = await Promise.all([
    getClock(db, id),
    getClockPlayers(db, id),
    getServerNowMs(db),
  ]);
  const loadError = error ?? players.error;
  if (loadError) return { success: false, message: loadError.message };
  if (!clock || !players.data) return { success: false, message: CLOCK_GONE };

  const plan = planFinishClock(clock, players.data.entrants, nowMs);
  if (!plan.ok) {
    return { success: false, message: finishRefusalMessage(plan.reason) };
  }

  const { data, error: finishError } = await db.rpc("finish_tournament_clock", {
    p_clock_id: id,
    p_winner_id: plan.value.winnerId,
    p_finished_at: plan.value.finishedAt,
    p_level_index: plan.value.levelIndex,
    p_remaining_ms: plan.value.remainingMs,
  });
  if (finishError) {
    const message =
      finishError.code === NO_DATA_FOUND
        ? CHANGED_ELSEWHERE
        : finishError.message;
    return { success: false, message };
  }
  return savedClockAndPlayers(db, data as ClockRow, "Tournament ended.");
}

// Ends the tournament: the one player left wins, and the clock stops.
export async function finishClockAction(
  id: string,
): Promise<ClockFinishResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await finishClock(id);
  } catch (error) {
    console.error("Error finishing tournament clock:", error);
    return { success: false, message: "Couldn't end the tournament." };
  }
}

// Undoes a finish pressed by mistake, until the results are saved: the
// clock is paused again and the winner back in.
export async function reopenClockAction(
  id: string,
): Promise<ClockFinishResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    const db = await createClient();
    const { data, error } = await db.rpc("reopen_tournament_clock", {
      p_clock_id: id,
    });
    if (error) {
      const message =
        error.code === NO_DATA_FOUND
          ? "This clock's results are saved, or it isn't finished."
          : error.message;
      return { success: false, message };
    }
    return savedClockAndPlayers(db, data as ClockRow, "Tournament reopened.");
  } catch (error) {
    console.error("Error reopening tournament clock:", error);
    return { success: false, message: "Couldn't reopen the tournament." };
  }
}

// Changes a clock's name, money, chips and max rebuys while it isn't
// finished. Lowering max rebuys below what a player already has is allowed.
export async function updateClockSettingsAction(
  clockId: string,
  details: ClockDetails,
): Promise<ClockSettingsActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    const errors = validateClockDetails(details);
    if (errors.length > 0) {
      return { success: false, message: "Fix the settings.", errors };
    }

    const db = await createClient();
    const { data, error } = await db
      .from("_tournament_clocks")
      .update({
        name: details.name.trim(),
        buy_in: details.buy_in,
        rebuy: details.rebuy,
        starting_chips: details.starting_chips,
        rebuy_chips: details.rebuy_chips,
        max_rebuys: details.max_rebuys,
      })
      .eq("id", clockId)
      .neq("status", "finished")
      .select()
      .maybeSingle();
    if (error) return { success: false, message: error.message };
    if (!data) {
      return {
        success: false,
        message: "This clock is finished or no longer exists.",
      };
    }

    revalidatePath(CLOCKS_PATH);
    return {
      success: true,
      message: "Settings saved.",
      clock: toClock(data as ClockRow),
    };
  } catch (error) {
    console.error("Error saving clock settings:", error);
    return { success: false, message: "Couldn't save the settings." };
  }
}

function levelEditRefusalMessage(reason: LevelEditRefusal): string {
  switch (reason) {
    case "finished":
      return "This clock is finished.";
    case "invalid_levels":
      return "Fix the levels.";
    case "clock_moved":
      return CHANGED_ELSEWHERE;
  }
}

async function saveLevels(
  clockId: string,
  levels: BlindLevel[],
): Promise<ClockControlResult> {
  const { db, clock, error, nowMs } = await loadClockAndTime(clockId);
  if (error) return { success: false, message: error.message };
  if (!clock) return { success: false, message: CLOCK_GONE };

  const plan = planLevelEdit(clock, levels, nowMs);
  if (!plan.ok) {
    return { success: false, message: levelEditRefusalMessage(plan.reason) };
  }

  let query = db
    .from("_tournament_clocks")
    .update(plan.value)
    .eq("id", clockId)
    .eq("status", clock.status)
    .eq("level_index", clock.level_index);
  // Also guards against a +1 min or -1 min pressed on another screen, which
  // moves the timing without changing the status or level.
  if (clock.status === "running") {
    query = query.eq("level_started_at", clock.level_started_at);
  } else if (clock.status === "paused") {
    query = query.eq("paused_remaining_ms", clock.paused_remaining_ms);
  }

  const { data, error: saveError } = await query.select().maybeSingle();
  if (saveError) return { success: false, message: saveError.message };
  if (!data) return { success: false, message: CHANGED_ELSEWHERE };

  return {
    success: true,
    message: "Levels saved.",
    clock: toClock(data as ClockRow),
  };
}

// Saves an edited list of levels while the clock isn't finished. The server
// re-checks every row, so the page's list is never trusted.
export async function updateClockLevelsAction(
  clockId: string,
  levels: BlindLevel[],
): Promise<ClockControlResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await saveLevels(clockId, levels);
  } catch (error) {
    console.error("Error saving clock levels:", error);
    return { success: false, message: "Couldn't save the levels." };
  }
}
