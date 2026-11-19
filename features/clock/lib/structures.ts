import {
  cleanNote,
  levelDurationMs,
  levelProblem,
} from "@/features/clock/lib/levels";
import type {
  BlindLevel,
  BlindStructure,
  BlindStructureLevel,
} from "@/features/clock/types";

export const NAME_MAX_LENGTH = 60;
// Length of a new level when nothing else says otherwise.
export const DEFAULT_LEVEL_SECONDS = 20 * 60;
// Length of a new break when nothing else says otherwise.
export const DEFAULT_BREAK_SECONDS = 10 * 60;
const MIN_PLACES_PAID = 3;
const PERCENT_TOTAL = 100;
// Percentages are typed by hand and can carry float error (33.3 + 33.3 + 33.4).
const PERCENT_TOLERANCE = 0.000001;

// Common splits for the places above the last paid place, by places paid.
// (The last paid place's share is set by the player count; see
// computePayouts.) Changing places paid in the editor fills these in.
export const SUGGESTED_SPLITS: Record<number, number[]> = {
  3: [65, 35],
  4: [55, 30, 15],
  5: [45, 28, 17, 10],
};

// A level being edited. `key` is a stable React key and is never saved.
export type DraftLevel = BlindLevel & { key: string };

// A template being edited, with short field names; draftToSaveInput maps
// them to the _blind_structures columns.
export type StructureDraft = {
  name: string;
  buy_in: number;
  rebuy: number;
  starting_chips: number;
  rebuy_chips: number;
  places_paid: number;
  payout_pcts: number[];
  max_rebuys: number;
  levels: DraftLevel[];
  // Editor only, never saved: the length of each level "Add level" creates.
  new_level_seconds: number;
  // Editor only, never saved: the length of each break "Add break" creates.
  new_break_seconds: number;
};

export type StructureField =
  | "name"
  | "money"
  | "chips"
  | "places_paid"
  | "payout_pcts"
  | "max_rebuys"
  | "levels";

export type StructureError = {
  field: StructureField;
  // Set when one level row is the problem.
  levelIndex?: number;
  message: string;
};

// What save_blind_structure takes.
export type StructureSaveInput = {
  structure: Omit<BlindStructure, "id" | "created_at">;
  levels: BlindLevel[];
};

// A new template: the league's usual money, chips and payouts, and one level.
export function newStructureDraft(): StructureDraft {
  return {
    name: "",
    buy_in: 40,
    rebuy: 40,
    starting_chips: 20000,
    rebuy_chips: 20000,
    places_paid: 4,
    payout_pcts: [...SUGGESTED_SPLITS[4]],
    max_rebuys: 2,
    levels: [
      {
        key: "new-1",
        kind: "level",
        small_blind: 100,
        big_blind: 200,
        ante: 0,
        duration_seconds: DEFAULT_LEVEL_SECONDS,
      },
    ],
    new_level_seconds: DEFAULT_LEVEL_SECONDS,
    new_break_seconds: DEFAULT_BREAK_SECONDS,
  };
}

// The length most of a template's rows of this kind have (the first one
// wins a tie), or the fallback with none.
function mostCommonSeconds(
  levels: BlindLevel[],
  kind: BlindLevel["kind"],
  fallback: number,
): number {
  const counts = new Map<number, number>();
  for (const level of levels) {
    if (level.kind !== kind) continue;
    const seconds = level.duration_seconds;
    counts.set(seconds, (counts.get(seconds) ?? 0) + 1);
  }
  let best = fallback;
  let bestCount = 0;
  counts.forEach((count, seconds) => {
    if (count > bestCount) [best, bestCount] = [seconds, count];
  });
  return best;
}

export function structureToDraft(
  structure: BlindStructure,
  levels: BlindStructureLevel[],
): StructureDraft {
  return {
    new_level_seconds: mostCommonSeconds(
      levels,
      "level",
      DEFAULT_LEVEL_SECONDS,
    ),
    new_break_seconds: mostCommonSeconds(
      levels,
      "break",
      DEFAULT_BREAK_SECONDS,
    ),
    name: structure.name,
    buy_in: structure.default_buy_in,
    rebuy: structure.default_rebuy,
    starting_chips: structure.default_starting_chips,
    rebuy_chips: structure.default_rebuy_chips,
    places_paid: structure.default_places_paid,
    payout_pcts: [...structure.default_payout_pcts],
    max_rebuys: structure.default_max_rebuys,
    levels: [...levels]
      .sort((a, b) => a.position - b.position)
      .map((level) => ({
        key: level.id,
        kind: level.kind,
        small_blind: level.small_blind,
        big_blind: level.big_blind,
        ante: level.ante,
        duration_seconds: level.duration_seconds,
        ...(level.note && { note: level.note }),
      })),
  };
}

export function draftToSaveInput(draft: StructureDraft): StructureSaveInput {
  return {
    structure: {
      name: draft.name.trim(),
      default_buy_in: draft.buy_in,
      default_rebuy: draft.rebuy,
      default_starting_chips: draft.starting_chips,
      default_rebuy_chips: draft.rebuy_chips,
      default_places_paid: draft.places_paid,
      default_payout_pcts: [...draft.payout_pcts],
      default_max_rebuys: draft.max_rebuys,
    },
    levels: draft.levels.map((level) => {
      // Notes are for breaks; a blank one isn't sent.
      const note = level.kind === "break" ? cleanNote(level.note) : null;
      return {
        kind: level.kind,
        small_blind: level.small_blind,
        big_blind: level.big_blind,
        ante: level.ante,
        duration_seconds: level.duration_seconds,
        ...(note && { note }),
      };
    }),
  };
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isPositiveWholeNumber(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function nameError(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Give the template a name.";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Keep the name to ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

// The payout percentages added up, counting an empty box as 0.
export function payoutTotal(pcts: number[]): number {
  return pcts.reduce((sum, pct) => sum + (Number.isNaN(pct) ? 0 : pct), 0);
}

// Whether the percentages add up to 100 (allowing for hand-typed decimals).
export function isCompleteSplit(pcts: number[]): boolean {
  return Math.abs(payoutTotal(pcts) - PERCENT_TOTAL) <= PERCENT_TOLERANCE;
}

// Same rule as private.payout_pcts_valid: one share for each place above
// the last paid place, each above zero, adding up to 100.
function payoutError(draft: StructureDraft): string | null {
  const { payout_pcts: pcts, places_paid: places } = draft;
  if (pcts.length !== places - 1)
    return `Enter a percentage for each of the ${places - 1} places above the last paid place.`;
  if (pcts.some((pct) => !(pct > 0)))
    return "Every paid place needs more than 0%.";
  if (!isCompleteSplit(pcts)) {
    return `Payouts add up to ${payoutTotal(pcts)}%; they need to add up to 100%.`;
  }
  return null;
}

function levelErrors(levels: DraftLevel[]): StructureError[] {
  const rowErrors = levels.flatMap((level, levelIndex): StructureError[] => {
    const problem = levelProblem(level);
    return problem ? [{ field: "levels", levelIndex, message: problem }] : [];
  });
  if (rowErrors.length > 0) return rowErrors;
  if (!levels.some(({ kind }) => kind === "level")) {
    return [{ field: "levels", message: "Add at least one level." }];
  }
  return [];
}

// Everything wrong with a draft, in form order. Empty means it can be saved.
// The rules match the database checks, so a valid draft won't be rejected.
export function validateStructureDraft(
  draft: StructureDraft,
): StructureError[] {
  const errors: StructureError[] = [];
  const add = (field: StructureField, message: string | null): void => {
    if (message) errors.push({ field, message });
  };

  add("name", nameError(draft.name));
  add(
    "money",
    isMoney(draft.buy_in) && isMoney(draft.rebuy)
      ? null
      : "Buy-in and rebuy must be $0 or more.",
  );
  add(
    "chips",
    isPositiveWholeNumber(draft.starting_chips) &&
      isPositiveWholeNumber(draft.rebuy_chips)
      ? null
      : "Chip counts must be whole numbers above 0.",
  );
  add(
    "places_paid",
    Number.isInteger(draft.places_paid) && draft.places_paid >= MIN_PLACES_PAID
      ? null
      : `Pay at least ${MIN_PLACES_PAID} places.`,
  );
  // Payout percentages only make sense once places paid is valid.
  if (!errors.some(({ field }) => field === "places_paid")) {
    add("payout_pcts", payoutError(draft));
  }
  add(
    "max_rebuys",
    Number.isInteger(draft.max_rebuys) && draft.max_rebuys >= 0
      ? null
      : "Max rebuys must be a whole number, 0 or more.",
  );
  return [...errors, ...levelErrors(draft.levels)];
}

export type LevelSummary = {
  levelCount: number;
  breakCount: number;
  lengthMs: number;
};

export function summarizeLevels(levels: BlindLevel[]): LevelSummary {
  return {
    levelCount: levels.filter(({ kind }) => kind === "level").length,
    breakCount: levels.filter(({ kind }) => kind === "break").length,
    lengthMs: levels.reduce(
      (total, level) => total + levelDurationMs(level),
      0,
    ),
  };
}

// The first free "Copy of <name>", "Copy 2 of <name>", … among takenNames,
// cut to the name length limit.
export function copyName(name: string, takenNames: string[]): string {
  const taken = new Set(takenNames);
  for (let copy = 1; ; copy += 1) {
    const prefix = copy === 1 ? "Copy of " : `Copy ${copy} of `;
    const candidate = (prefix + name).slice(0, NAME_MAX_LENGTH);
    if (!taken.has(candidate)) return candidate;
  }
}

// When each row starts, in ms from the start of the tournament.
export function levelStartTimes(levels: BlindLevel[]): number[] {
  let elapsedMs = 0;
  return levels.map((level) => {
    const startMs = elapsedMs;
    elapsedMs += levelDurationMs(level);
    return startMs;
  });
}

// Whether `draft` would save anything different from `saved`. Ignores the
// editor-only new level length and row keys, and catches edits typed then
// undone.
export function hasUnsavedChanges(
  saved: StructureDraft,
  draft: StructureDraft,
): boolean {
  return (
    JSON.stringify(draftToSaveInput(saved)) !==
    JSON.stringify(draftToSaveInput(draft))
  );
}
