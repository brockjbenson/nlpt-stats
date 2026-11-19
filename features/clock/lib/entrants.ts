import { fail, ok, type Result } from "@/features/clock/lib/result";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";

// Entrants who haven't busted.
export function playersLeft(entrants: ClockEntrant[]): ClockEntrant[] {
  return entrants.filter((entrant) => entrant.busted_at === null);
}

// The latest bust has the lowest finishing place so far.
function isMostRecentBust(
  entrants: ClockEntrant[],
  entrant: ClockEntrant,
): boolean {
  const places = entrants
    .map(({ finish_place }) => finish_place)
    .filter((place): place is number => place !== null);
  return (
    entrant.finish_place !== null &&
    entrant.finish_place === Math.min(...places)
  );
}

type ClearedBust = { busted_at: null; finish_place: null };
const CLEARED_BUST: ClearedBust = { busted_at: null, finish_place: null };

export type BustRefusal = "not_found" | "already_busted" | "last_player";

// The player finishes in the place equal to how many were left, so the
// first out of 10 is 10th. The last player is placed 1st by planFinish.
export function planBust(
  entrants: ClockEntrant[],
  entrantId: string,
  nowMs: number,
): Result<{ busted_at: string; finish_place: number }, BustRefusal> {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant) return fail("not_found");
  if (entrant.busted_at !== null) return fail("already_busted");

  const left = playersLeft(entrants).length;
  if (left <= 1) return fail("last_player");
  return ok({ busted_at: new Date(nowMs).toISOString(), finish_place: left });
}

export type UndoBustRefusal = "not_found" | "not_busted" | "not_most_recent";

// Only the most recent bust can be undone, so places stay consecutive.
export function planUndoBust(
  entrants: ClockEntrant[],
  entrantId: string,
): Result<ClearedBust, UndoBustRefusal> {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant) return fail("not_found");
  if (entrant.busted_at === null) return fail("not_busted");
  if (!isMostRecentBust(entrants, entrant)) return fail("not_most_recent");
  return ok(CLEARED_BUST);
}

export type RebuyRefusal =
  | "not_found"
  | "wrong_status"
  | "max_rebuys"
  | "not_most_recent"
  | "in_the_money";

// A rebuy adds chips; for a busted player it's a re-entry and clears the
// bust. Allowed while the clock is running or paused, up to the clock's
// max_rebuys per player, and only while more players are left than places
// paid. A busted player can only re-enter as the most recent bust, or the
// next bust would get a place that's already taken.
export function planRebuy(
  clock: Pick<TournamentClock, "status" | "max_rebuys" | "places_paid">,
  entrants: ClockEntrant[],
  entrantId: string,
): Result<{ rebuys: number } & ClearedBust, RebuyRefusal> {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant) return fail("not_found");
  if (clock.status !== "running" && clock.status !== "paused") {
    return fail("wrong_status");
  }
  if (entrant.rebuys >= clock.max_rebuys) return fail("max_rebuys");
  if (entrant.busted_at !== null && !isMostRecentBust(entrants, entrant)) {
    return fail("not_most_recent");
  }
  if (playersLeft(entrants).length <= clock.places_paid) {
    return fail("in_the_money");
  }
  return ok({ rebuys: entrant.rebuys + 1, ...CLEARED_BUST });
}

export type FinishRefusal = "players_remaining" | "no_players";

// When the clock finishes, the one player left wins.
export function planFinish(
  entrants: ClockEntrant[],
): Result<{ entrantId: string; finish_place: 1 }, FinishRefusal> {
  const left = playersLeft(entrants);
  if (left.length === 0) return fail("no_players");
  if (left.length > 1) return fail("players_remaining");
  return ok({ entrantId: left[0].id, finish_place: 1 });
}
