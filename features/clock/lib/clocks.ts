import {
  type DetailFields,
  type SettingsFields,
  type StructureError,
  validateDetails,
  validateSettings,
} from "@/features/clock/lib/structures";
import type {
  BlindLevel,
  BlindStructure,
  BlindStructureLevel,
  ClockStatus,
  TournamentClock,
} from "@/features/clock/types";

// A clock's settings as a form edits them: prefilled from its template for
// a new clock, or from the saved clock when editing. Levels have their own
// editor.
export type ClockSettings = SettingsFields;

// The settings a running clock lets admins edit: everything but the payouts,
// which have their own card.
export type ClockDetails = DetailFields;

// The _tournament_clocks columns to insert for a new clock.
export type ClockInsert = Omit<TournamentClock, "id" | "created_at">;

// The template's defaults, with the clock named after the template. The
// name carries no date: the clock list shows when each was created.
export function clockSettingsFromStructure(
  structure: BlindStructure,
): ClockSettings {
  return {
    name: structure.name,
    buy_in: structure.default_buy_in,
    rebuy: structure.default_rebuy,
    starting_chips: structure.default_starting_chips,
    rebuy_chips: structure.default_rebuy_chips,
    places_paid: structure.default_places_paid,
    payout_pcts: [...structure.default_payout_pcts],
    max_rebuys: structure.default_max_rebuys,
  };
}

// Everything wrong with a new clock's settings; empty means it can be made.
export function validateClockSettings(
  settings: ClockSettings,
): StructureError[] {
  return validateSettings(settings, "clock");
}

// A saved clock's settings, as the edit forms start from them.
export function clockSettingsOf(clock: TournamentClock): ClockSettings {
  return {
    name: clock.name,
    buy_in: clock.buy_in,
    rebuy: clock.rebuy,
    starting_chips: clock.starting_chips,
    rebuy_chips: clock.rebuy_chips,
    places_paid: clock.places_paid,
    payout_pcts: [...clock.payout_pcts],
    max_rebuys: clock.max_rebuys,
  };
}

// Just the details of a clock's settings, for saving them without the payouts.
export function clockDetailsOf(settings: ClockSettings): ClockDetails {
  return {
    name: settings.name,
    buy_in: settings.buy_in,
    rebuy: settings.rebuy,
    starting_chips: settings.starting_chips,
    rebuy_chips: settings.rebuy_chips,
    max_rebuys: settings.max_rebuys,
  };
}

// Everything wrong with a running clock's edited details (no payouts); empty
// means they can be saved. The screen and the action share this check.
export function validateClockDetails(details: ClockDetails): StructureError[] {
  return validateDetails(details, "clock");
}

// A template row as a clock level: the playing fields, and the note only
// when there is one.
function toClockLevel(level: BlindStructureLevel): BlindLevel {
  return {
    kind: level.kind,
    small_blind: level.small_blind,
    big_blind: level.big_blind,
    ante: level.ante,
    duration_seconds: level.duration_seconds,
    ...(level.note && { note: level.note }),
  };
}

// The row for a new clock: a snapshot of the template's levels (so editing
// the template later never changes this clock), the settings, and setup
// status on the first level.
export function buildClockInsert(
  structure: BlindStructure,
  levels: BlindStructureLevel[],
  settings: ClockSettings,
): ClockInsert {
  return {
    name: settings.name.trim(),
    structure_id: structure.id,
    tournament_id: null,
    levels: [...levels]
      .sort((a, b) => a.position - b.position)
      .map(toClockLevel),
    status: "setup",
    level_index: 0,
    level_started_at: null,
    paused_remaining_ms: null,
    buy_in: settings.buy_in,
    rebuy: settings.rebuy,
    starting_chips: settings.starting_chips,
    rebuy_chips: settings.rebuy_chips,
    places_paid: settings.places_paid,
    payout_pcts: [...settings.payout_pcts],
    max_rebuys: settings.max_rebuys,
  };
}

const STATUS_LABELS: Record<ClockStatus, string> = {
  setup: "Not started",
  running: "Running",
  paused: "Paused",
  finished: "Finished",
};

// What a clock's status reads as on screen.
export function clockStatusLabel(status: ClockStatus): string {
  return STATUS_LABELS[status];
}
