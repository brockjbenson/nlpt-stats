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

// Each paid place's share of the pool, 1st place first. With fewer players
// than paid places, only that many places are paid and their shares are
// scaled up to add to 100. Not rounded: round where it's shown or saved.
export function computePayouts(
  pool: number,
  payoutPcts: number[],
  entrantCount: number,
): number[] {
  const paidPcts = payoutPcts.slice(0, Math.max(0, entrantCount));
  const pctTotal = paidPcts.reduce((total, pct) => total + pct, 0);
  if (pctTotal === 0) return [];
  return paidPcts.map((pct) => (pool * pct) / pctTotal);
}
