import {
  computePayouts,
  computePool,
  totalRebuys,
} from "@/features/clock/lib/money";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";

// What the finish step saves to _tournaments (besides name, date and week,
// which are chosen on the review screen).
export type FinishTournament = {
  // Places actually paid: fewer than the clock's when fewer played.
  places_paid: number;
  buy_in_amount: number;
  rebuy_amount: number;
  // Guests included.
  player_count: number;
  total_rebuys: number;
};

// One _tournament_sessions row. Buy-in, net profit and points are worked
// out by _tournament_session_points.
export type FinishSession = {
  member_id: string;
  rebuys: number;
  cash_out: number;
  place: number;
};

export type FinishResults = {
  tournament: FinishTournament;
  sessions: FinishSession[];
};

export type FinishResultsRefusal = "no_entrants" | "unplaced_entrants";

type PlacedMember = ClockEntrant & { member_id: string; finish_place: number };

function isPlacedMember(entrant: ClockEntrant): entrant is PlacedMember {
  return entrant.member_id !== null && entrant.finish_place !== null;
}

// Payouts go by true finishing place, guests included. Only members are
// saved, re-ranked 1, 2, 3… among themselves, each keeping the payout of
// the place they actually finished: if a guest wins, the member who came
// 2nd is saved as 1st with the 2nd-place payout.
export function buildFinishResults(
  clock: Pick<
    TournamentClock,
    "buy_in" | "rebuy" | "payout_pcts" | "places_paid"
  >,
  entrants: ClockEntrant[],
): Result<FinishResults, FinishResultsRefusal> {
  if (entrants.length === 0) return fail("no_entrants");
  if (entrants.some(({ finish_place }) => finish_place === null)) {
    return fail("unplaced_entrants");
  }

  const payouts = computePayouts(
    computePool(clock, entrants),
    clock.payout_pcts,
    entrants.length,
  );
  const sessions = entrants
    .filter(isPlacedMember)
    .sort((a, b) => a.finish_place - b.finish_place)
    .map(
      (entrant, index): FinishSession => ({
        member_id: entrant.member_id,
        rebuys: entrant.rebuys,
        cash_out: payouts[entrant.finish_place - 1] ?? 0,
        place: index + 1,
      }),
    );

  return ok({
    tournament: {
      places_paid: payouts.length,
      buy_in_amount: clock.buy_in,
      rebuy_amount: clock.rebuy,
      player_count: entrants.length,
      total_rebuys: totalRebuys(entrants),
    },
    sessions,
  });
}
