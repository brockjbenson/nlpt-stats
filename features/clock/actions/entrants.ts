"use server";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  type ClockRow,
  getClock,
  getServerNowMs,
  toClock,
} from "@/features/clock/data/clocks";
import { getClockPlayers } from "@/features/clock/data/entrants";
import { planRebuy } from "@/features/clock/lib/entrants";
import {
  addRefusalMessage,
  bustRefusalMessage,
  changeKnockerRefusalMessage,
  rebuyRefusalMessage,
  takeAwayRebuyRefusalMessage,
  undoRefusalMessage,
} from "@/features/clock/lib/player-messages";
import {
  canRemoveEntrant,
  planAddEntrants,
  planBustPlayer,
  planChangeKnocker,
  planTakeAwayRebuy,
  planUndoPlayer,
} from "@/features/clock/lib/players";
import {
  type PayoutSettings,
  type StructureError,
  validatePayouts,
} from "@/features/clock/lib/structures";
import type {
  ClockEntrant,
  ClockKnockout,
  TournamentClock,
} from "@/features/clock/types";
import { isAdmin } from "@/features/clock/actions/is-admin";
import { createClient } from "@/utils/supabase/server";

// A player change's outcome. On success, the clock's players and
// knockouts as saved, so the screen can show them before the Realtime
// events arrive.
export type PlayersActionResult = {
  success: boolean;
  message: string;
  entrants?: ClockEntrant[];
  knockouts?: ClockKnockout[];
};

// A payouts change's outcome: the saved clock, or the field problems.
export type PayoutsActionResult = {
  success: boolean;
  message: string;
  clock?: TournamentClock;
  errors?: StructureError[];
};

const NOT_ADMIN = {
  success: false,
  message: "Only admins can change tournament clocks.",
} as const;
const CLOCK_GONE = "This clock no longer exists.";
const CHANGED_ELSEWHERE = "The players changed on another screen. Try again.";
const CANT_REMOVE = "This player can't be removed now.";

// Postgres error codes the player functions and tables raise.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const NO_DATA_FOUND = "P0002";

function failed(message: string): PlayersActionResult {
  return { success: false, message };
}

// A write that lost a race with another screen reads as "changed
// elsewhere"; anything else shows the database's message.
function writeFailure(error: PostgrestError): PlayersActionResult {
  if (error.code === UNIQUE_VIOLATION || error.code === NO_DATA_FOUND) {
    return failed(CHANGED_ELSEWHERE);
  }
  if (error.code === FOREIGN_KEY_VIOLATION) return failed(CANT_REMOVE);
  return failed(error.message);
}

type LoadedClock = {
  db: SupabaseClient;
  clock: TournamentClock;
  entrants: ClockEntrant[];
  knockouts: ClockKnockout[];
};

// The clock with its players and knockouts, or a failure to return.
async function loadPlayers(
  clockId: string,
): Promise<LoadedClock | PlayersActionResult> {
  const db = await createClient();
  const [clockResult, playersResult] = await Promise.all([
    getClock(db, clockId),
    getClockPlayers(db, clockId),
  ]);
  const error = clockResult.error ?? playersResult.error;
  if (error) return failed(error.message);
  if (!clockResult.data || !playersResult.data) return failed(CLOCK_GONE);
  return { db, clock: clockResult.data, ...playersResult.data };
}

function isLoaded(
  value: LoadedClock | PlayersActionResult,
): value is LoadedClock {
  return "clock" in value;
}

// The lists after a successful write.
async function savedPlayers(
  db: SupabaseClient,
  clockId: string,
  message: string,
): Promise<PlayersActionResult> {
  const { data } = await getClockPlayers(db, clockId);
  // The write went through; if the re-read fails, Realtime brings the rows.
  return { success: true, message, ...data };
}

// Runs a player change for an admin: loads the clock's players, applies
// the change, and turns anything unexpected into a message.
async function changePlayers(
  clockId: string,
  // What the change does, for messages: "add players".
  task: string,
  change: (loaded: LoadedClock) => Promise<PlayersActionResult>,
): Promise<PlayersActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    const loaded = await loadPlayers(clockId);
    return isLoaded(loaded) ? await change(loaded) : loaded;
  } catch (error) {
    console.error(`Error trying to ${task}:`, error);
    return failed(`Couldn't ${task}.`);
  }
}

// Adds members and guests while nobody is out.
export async function addEntrantsAction(
  clockId: string,
  memberIds: string[],
  guestNames: string[],
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "add players", async (loaded) => {
    const plan = planAddEntrants(
      loaded.clock,
      loaded.entrants,
      memberIds,
      guestNames,
    );
    if (!plan.ok) return failed(addRefusalMessage(plan.reason));

    const { error } = await loaded.db
      .from("_clock_entrants")
      .insert(plan.value.map((row) => ({ ...row, clock_id: clockId })));
    if (error) return writeFailure(error);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Removes a player added by mistake: never busted and in no knockout.
export async function removeEntrantAction(
  clockId: string,
  entrantId: string,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "remove the player", async (loaded) => {
    const entrant = loaded.entrants.find(({ id }) => id === entrantId);
    if (!entrant) return failed(CHANGED_ELSEWHERE);
    if (loaded.clock.status === "finished") {
      return failed(addRefusalMessage("finished"));
    }
    if (!canRemoveEntrant(entrant, loaded.knockouts)) {
      return failed(CANT_REMOVE);
    }

    const { data, error } = await loaded.db
      .from("_clock_entrants")
      .delete()
      .eq("id", entrantId)
      .eq("clock_id", clockId)
      .is("busted_at", null)
      .select("id");
    if (error) return writeFailure(error);
    if (!data || data.length === 0) return failed(CHANGED_ELSEWHERE);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Busts a player into the next place, recording who knocked them out
// (null: not recorded). The place and the knockout row save together.
export async function bustEntrantAction(
  clockId: string,
  entrantId: string,
  knockedOutBy: string | null,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "bust the player", async (loaded) => {
    const nowMs = await getServerNowMs(loaded.db);
    const plan = planBustPlayer(
      loaded.clock,
      loaded.entrants,
      entrantId,
      knockedOutBy,
      nowMs,
    );
    if (!plan.ok) return failed(bustRefusalMessage(plan.reason));

    // A second screen busting into the same place is refused by the
    // unique place per clock; a player already out, by the function.
    const { error } = await loaded.db.rpc("bust_clock_entrant", {
      p_entrant_id: entrantId,
      p_finish_place: plan.value.finish_place,
      p_busted_at: plan.value.busted_at,
      p_knocked_out_by: plan.value.knocked_out_by,
    });
    if (error) return writeFailure(error);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Undoes the most recent bust: the player is back in and the knockout row
// is removed.
export async function undoBustAction(
  clockId: string,
  entrantId: string,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "undo the bust", async (loaded) => {
    const plan = planUndoPlayer(loaded.clock, loaded.entrants, entrantId);
    if (!plan.ok) return failed(undoRefusalMessage(plan.reason));

    const { error } = await loaded.db.rpc("undo_clock_bust", {
      p_entrant_id: entrantId,
    });
    if (error) return writeFailure(error);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// A rebuy: one more for a player still in, or a re-entry for the most
// recent bust (their place is cleared; the knockout row stays). Saved only
// if the player hasn't changed since they were read.
export async function rebuyEntrantAction(
  clockId: string,
  entrantId: string,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "rebuy", async (loaded) => {
    const entrant = loaded.entrants.find(({ id }) => id === entrantId);
    const plan = planRebuy(loaded.clock, loaded.entrants, entrantId);
    if (!plan.ok) {
      return failed(rebuyRefusalMessage(plan.reason, loaded.clock.max_rebuys));
    }
    if (!entrant) return failed(CHANGED_ELSEWHERE);

    const update = loaded.db
      .from("_clock_entrants")
      .update(plan.value)
      .eq("id", entrantId)
      .eq("clock_id", clockId)
      .eq("rebuys", entrant.rebuys);
    const unchanged =
      entrant.finish_place === null
        ? update.is("busted_at", null)
        : update.eq("finish_place", entrant.finish_place);
    const { data, error } = await unchanged.select("id");
    if (error) return writeFailure(error);
    if (!data || data.length === 0) return failed(CHANGED_ELSEWHERE);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Takes one rebuy back from a player, for a rebuy given by mistake. Saved
// only if their rebuys haven't changed since they were read.
export async function takeAwayRebuyAction(
  clockId: string,
  entrantId: string,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "take away the rebuy", async (loaded) => {
    const entrant = loaded.entrants.find(({ id }) => id === entrantId);
    const plan = planTakeAwayRebuy(loaded.clock, loaded.entrants, entrantId);
    if (!plan.ok) return failed(takeAwayRebuyRefusalMessage(plan.reason));
    if (!entrant) return failed(CHANGED_ELSEWHERE);

    const { data, error } = await loaded.db
      .from("_clock_entrants")
      .update(plan.value)
      .eq("id", entrantId)
      .eq("clock_id", clockId)
      .eq("rebuys", entrant.rebuys)
      .select("id");
    if (error) return writeFailure(error);
    if (!data || data.length === 0) return failed(CHANGED_ELSEWHERE);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Fixes who knocked a busted player out (null: not recorded). Saved only if
// the knockout still has the knocker it was read with.
export async function changeKnockerAction(
  clockId: string,
  entrantId: string,
  knockedOutBy: string | null,
): Promise<PlayersActionResult> {
  return changePlayers(clockId, "change the knockout", async (loaded) => {
    const plan = planChangeKnocker(
      loaded.clock,
      loaded.entrants,
      loaded.knockouts,
      entrantId,
      knockedOutBy,
    );
    if (!plan.ok) return failed(changeKnockerRefusalMessage(plan.reason));
    const knockout = loaded.knockouts.find(
      ({ id }) => id === plan.value.knockoutId,
    );
    if (!knockout) return failed(CHANGED_ELSEWHERE);

    const update = loaded.db
      .from("_clock_knockouts")
      .update({ knocked_out_by: plan.value.knocked_out_by })
      .eq("id", plan.value.knockoutId)
      .eq("clock_id", clockId);
    const unchanged =
      knockout.knocked_out_by === null
        ? update.is("knocked_out_by", null)
        : update.eq("knocked_out_by", knockout.knocked_out_by);
    const { data, error } = await unchanged.select("id");
    if (error) return writeFailure(error);
    if (!data || data.length === 0) return failed(CHANGED_ELSEWHERE);
    return savedPlayers(loaded.db, clockId, "");
  });
}

// Changes places paid and the split while the clock isn't finished.
export async function updatePayoutsAction(
  clockId: string,
  payouts: PayoutSettings,
): Promise<PayoutsActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    const errors = validatePayouts(payouts);
    if (errors.length > 0) {
      return { success: false, message: "Fix the payouts.", errors };
    }

    const db = await createClient();
    const { data, error } = await db
      .from("_tournament_clocks")
      .update({
        places_paid: payouts.places_paid,
        payout_pcts: payouts.payout_pcts,
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
    return {
      success: true,
      message: "Payouts saved.",
      clock: toClock(data as ClockRow),
    };
  } catch (error) {
    console.error("Error saving clock payouts:", error);
    return { success: false, message: "Couldn't save the payouts." };
  }
}
