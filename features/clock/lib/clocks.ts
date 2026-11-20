import {
  NAME_MAX_LENGTH,
  type SettingsFields,
  type StructureError,
  validateSettings,
} from "@/features/clock/lib/structures";
import type {
  BlindLevel,
  BlindStructure,
  BlindStructureLevel,
  ClockStatus,
  TournamentClock,
} from "@/features/clock/types";

// A new clock's settings, prefilled from its template and editable before
// the clock is created. Levels aren't editable per clock.
export type ClockSettings = SettingsFields;

// The _tournament_clocks columns to insert for a new clock.
export type ClockInsert = Omit<TournamentClock, "id" | "created_at">;

const NAME_SEPARATOR = " – ";

// The template's defaults, with the clock named "<template> – <dateLabel>"
// (the template part shortened if the whole name would be too long).
export function clockSettingsFromStructure(
  structure: BlindStructure,
  dateLabel: string,
): ClockSettings {
  const suffix = `${NAME_SEPARATOR}${dateLabel}`;
  const base = structure.name.slice(0, NAME_MAX_LENGTH - suffix.length);
  return {
    name: `${base}${suffix}`,
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
