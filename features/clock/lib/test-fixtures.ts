import type {
  BlindLevel,
  ClockEntrant,
  TournamentClock,
} from "@/features/clock/types";

const TWENTY_MINUTES = 1200;
const TEN_MINUTES = 600;

function level(smallBlind: number, bigBlind: number): BlindLevel {
  return {
    kind: "level",
    small_blind: smallBlind,
    big_blind: bigBlind,
    ante: 0,
    duration_seconds: TWENTY_MINUTES,
  };
}

const BREAK: BlindLevel = {
  kind: "break",
  small_blind: null,
  big_blind: null,
  ante: 0,
  duration_seconds: TEN_MINUTES,
};

// The "NLPT Standard" structure: 16 levels of 20 minutes on the round big
// blind ladder, with 10-minute breaks after levels 4, 8 and 12 (19 rows,
// 5h 50m).
export const NLPT_STANDARD_LEVELS: BlindLevel[] = [
  level(100, 200),
  level(150, 300),
  level(200, 400),
  level(250, 500),
  BREAK,
  level(300, 600),
  level(400, 800),
  level(500, 1000),
  level(750, 1500),
  BREAK,
  level(1000, 2000),
  level(1500, 3000),
  level(2000, 4000),
  level(2500, 5000),
  BREAK,
  level(3000, 6000),
  level(4000, 8000),
  level(5000, 10000),
  level(7500, 15000),
];

let nextId = 0;
function uniqueId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

// A clock in setup with NLPT Standard money, chips and payouts.
export function makeClock(
  overrides: Partial<TournamentClock> = {},
): TournamentClock {
  return {
    id: uniqueId("clock"),
    name: "Test Clock",
    structure_id: null,
    tournament_id: null,
    levels: NLPT_STANDARD_LEVELS,
    status: "setup",
    level_index: 0,
    level_started_at: null,
    paused_remaining_ms: null,
    buy_in: 40,
    rebuy: 40,
    starting_chips: 20000,
    rebuy_chips: 20000,
    places_paid: 4,
    payout_pcts: [55, 30, 15],
    max_rebuys: 2,
    created_at: "2026-11-27T00:00:00.000Z",
    ...overrides,
  };
}

// A guest who is still in, unless overridden.
export function makeEntrant(
  overrides: Partial<ClockEntrant> = {},
): ClockEntrant {
  const id = uniqueId("entrant");
  return {
    id,
    clock_id: "clock",
    member_id: null,
    guest_name: `Guest ${id}`,
    rebuys: 0,
    busted_at: null,
    finish_place: null,
    created_at: "2026-11-27T00:00:00.000Z",
    ...overrides,
  };
}

// The database rule on which timing fields each status allows
// (tournament_clocks_status_fields_check).
export function satisfiesStatusRule(clock: TournamentClock): boolean {
  switch (clock.status) {
    case "setup":
      return (
        clock.level_started_at === null && clock.paused_remaining_ms === null
      );
    case "running":
      return (
        clock.level_started_at !== null && clock.paused_remaining_ms === null
      );
    case "paused":
      return clock.paused_remaining_ms !== null;
    case "finished":
      return true;
  }
}
