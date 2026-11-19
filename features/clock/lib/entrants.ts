import type { ClockEntrant } from "@/features/clock/types";

// Entrants who haven't busted.
export function playersLeft(entrants: ClockEntrant[]): ClockEntrant[] {
  return entrants.filter((entrant) => entrant.busted_at === null);
}
