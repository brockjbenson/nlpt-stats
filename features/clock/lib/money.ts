import { playersLeft } from "@/features/clock/lib/entrants";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";

export function totalRebuys(entrants: ClockEntrant[]): number {
  return entrants.reduce((total, entrant) => total + entrant.rebuys, 0);
}

// Everyone's buy-in plus every rebuy, guests and busted players included.
export function computePool(
  clock: Pick<TournamentClock, "buy_in" | "rebuy">,
  entrants: ClockEntrant[],
): number {
  return entrants.length * clock.buy_in + totalRebuys(entrants) * clock.rebuy;
}

export type ChipCount = {
  totalChips: number;
  playersLeft: number;
  // Null when nobody is left.
  averageStack: number | null;
};

export function computeChips(
  clock: Pick<TournamentClock, "starting_chips" | "rebuy_chips">,
  entrants: ClockEntrant[],
): ChipCount {
  const totalChips =
    entrants.length * clock.starting_chips +
    totalRebuys(entrants) * clock.rebuy_chips;
  const left = playersLeft(entrants).length;
  return {
    totalChips,
    playersLeft: left,
    averageStack: left > 0 ? totalChips / left : null,
  };
}

const PERCENT = 100;
// Keeps float noise (an exact 10% computed as 10.0000000001) from rounding up.
const ROUNDING_TOLERANCE = 1e-9;

// The last paid place's share of the pool, in percent: 1 / players (the
// buy-in back before rebuys), rounded up to a whole percent.
export function lastPlacePct(entrantCount: number): number {
  return Math.ceil(PERCENT / entrantCount - ROUNDING_TOLERANCE);
}

// Each paid place's payout, 1st place first. Not rounded: round where it's
// shown or saved.
//
// The last paid place gets lastPlacePct of the pool: at least the buy-in
// back, and more as rebuys grow the pool. The places above split the rest
// by payoutPcts (one per place above the last, adding to 100). With fewer
// players than paid places, only that many are paid and the shares of the
// places above are scaled to add to 100.
export function computePayouts(
  pool: number,
  payoutPcts: number[],
  entrantCount: number,
): number[] {
  if (entrantCount < 1) return [];
  const placesPaid = Math.min(payoutPcts.length + 1, entrantCount);
  if (placesPaid === 1) return [pool];

  const lastPlace = (pool * lastPlacePct(entrantCount)) / PERCENT;
  const abovePcts = payoutPcts.slice(0, placesPaid - 1);
  const pctTotal = abovePcts.reduce((total, pct) => total + pct, 0);
  const above = abovePcts.map((pct) => ((pool - lastPlace) * pct) / pctTotal);
  return [...above, lastPlace];
}
