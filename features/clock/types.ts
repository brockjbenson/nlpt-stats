// One level or break, as stored in _tournament_clocks.levels (a snapshot of
// a template's levels). Breaks have null blinds.
export type BlindLevel = {
  kind: "level" | "break";
  small_blind: number | null;
  big_blind: number | null;
  ante: number;
  duration_seconds: number;
  // Breaks only: what happens on the break ("Color up the 25s"). Optional.
  note?: string | null;
};

// A _blind_levels row: one level of a template, in position order.
export type BlindStructureLevel = BlindLevel & {
  id: string;
  structure_id: string;
  position: number;
};

// A _blind_structures row: a template a clock is created from.
export type BlindStructure = {
  id: string;
  name: string;
  default_buy_in: number;
  default_rebuy: number;
  default_starting_chips: number;
  default_rebuy_chips: number;
  default_places_paid: number;
  default_payout_pcts: number[];
  default_max_rebuys: number;
  created_at: string;
};

export type ClockStatus = "setup" | "running" | "paused" | "finished";

// A _tournament_clocks row. The current level's time is calculated from
// level_started_at (running) or paused_remaining_ms (paused).
export type TournamentClock = {
  id: string;
  name: string;
  structure_id: string | null;
  tournament_id: string | null;
  levels: BlindLevel[];
  status: ClockStatus;
  level_index: number;
  level_started_at: string | null;
  paused_remaining_ms: number | null;
  buy_in: number;
  rebuy: number;
  starting_chips: number;
  rebuy_chips: number;
  places_paid: number;
  payout_pcts: number[];
  max_rebuys: number;
  created_at: string;
};

// A _clock_entrants row: a member (member_id) or a guest (guest_name).
// busted_at and finish_place are set together when the player is out.
export type ClockEntrant = {
  id: string;
  clock_id: string;
  member_id: string | null;
  guest_name: string | null;
  rebuys: number;
  busted_at: string | null;
  finish_place: number | null;
  created_at: string;
};

// A _clock_knockouts row: one bust, and who caused it (null when it wasn't
// recorded). It stays if the player rebuys back in; undoing the bust
// deletes it.
export type ClockKnockout = {
  id: string;
  clock_id: string;
  entrant_id: string;
  knocked_out_by: string | null;
  busted_at: string;
  created_at: string;
};
