import {
  type DraftLevel,
  type StructureDraft,
  SUGGESTED_SPLITS,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";

const BREAK_SECONDS = 10 * 60;
const BLIND_STEP = 2; // a suggested level doubles the previous big blind
const FIRST_LEVEL: BlindLevel = {
  kind: "level",
  small_blind: 100,
  big_blind: 200,
  ante: 0,
  duration_seconds: 20 * 60,
};
// Places paid beyond this get no automatic percentage inputs: a typo like
// 400 shouldn't render 400 fields.
const MAX_RESIZED_PLACES = 20;

type NumberField =
  | "buy_in"
  | "rebuy"
  | "starting_chips"
  | "rebuy_chips"
  | "max_rebuys";

// New rows bring their own key so the reducer stays pure.
export type StructureEditorAction =
  | { type: "setField"; field: "name"; value: string }
  | { type: "setField"; field: NumberField; value: number }
  | { type: "setPlacesPaid"; value: number }
  | { type: "setPayoutPct"; index: number; value: number }
  | { type: "addLevel"; key: string }
  | { type: "addBreak"; key: string }
  | { type: "updateLevel"; index: number; change: Partial<BlindLevel> }
  | { type: "moveLevel"; index: number; direction: "up" | "down" }
  | { type: "removeLevel"; index: number };

// The level to offer after the playing levels in `levels`: same length and
// ante, small blind at the last big blind, big blind doubled.
function suggestLevel(levels: BlindLevel[]): BlindLevel {
  const last = levels.findLast(({ kind }) => kind === "level");
  if (!last?.big_blind) return FIRST_LEVEL;
  return {
    kind: "level",
    small_blind: last.big_blind,
    big_blind: last.big_blind * BLIND_STEP,
    ante: last.ante,
    duration_seconds: last.duration_seconds,
  };
}

function breakLevel(): BlindLevel {
  return {
    kind: "break",
    small_blind: null,
    big_blind: null,
    ante: 0,
    duration_seconds: BREAK_SECONDS,
  };
}

// The payout list for a new places-paid count (one share per place above
// the last): a suggested split when there is one, otherwise the current
// values trimmed or padded with zeros.
function resizePayouts(current: number[], places: number): number[] {
  const suggested = SUGGESTED_SPLITS[places];
  if (suggested) return [...suggested];
  if (!Number.isInteger(places) || places < 2 || places > MAX_RESIZED_PLACES) {
    return current;
  }
  return Array.from({ length: places - 1 }, (_, index) => current[index] ?? 0);
}

// Switching a row's kind resets it: a break loses its blinds, a new level
// gets blinds suggested from the levels above it.
function changeLevel(
  levels: DraftLevel[],
  index: number,
  change: Partial<BlindLevel>,
): DraftLevel {
  const row = levels[index];
  if (change.kind === "break" && row.kind !== "break") {
    return { ...breakLevel(), key: row.key };
  }
  if (change.kind === "level" && row.kind !== "level") {
    return { ...suggestLevel(levels.slice(0, index)), key: row.key };
  }
  return { ...row, ...change };
}

function swap<T>(items: T[], a: number, b: number): T[] {
  const swapped = [...items];
  [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
  return swapped;
}

function setLevels(
  draft: StructureDraft,
  levels: DraftLevel[],
): StructureDraft {
  return { ...draft, levels };
}

export function structureEditorReducer(
  draft: StructureDraft,
  action: StructureEditorAction,
): StructureDraft {
  switch (action.type) {
    case "setField":
      return { ...draft, [action.field]: action.value };

    case "setPlacesPaid":
      return {
        ...draft,
        places_paid: action.value,
        payout_pcts: resizePayouts(draft.payout_pcts, action.value),
      };

    case "setPayoutPct":
      return {
        ...draft,
        payout_pcts: draft.payout_pcts.map((pct, index) =>
          index === action.index ? action.value : pct,
        ),
      };

    case "addLevel":
      return setLevels(draft, [
        ...draft.levels,
        { ...suggestLevel(draft.levels), key: action.key },
      ]);

    case "addBreak":
      return setLevels(draft, [
        ...draft.levels,
        { ...breakLevel(), key: action.key },
      ]);

    case "updateLevel":
      return setLevels(
        draft,
        draft.levels.map((row, index) =>
          index === action.index
            ? changeLevel(draft.levels, index, action.change)
            : row,
        ),
      );

    case "moveLevel": {
      const target = action.index + (action.direction === "up" ? -1 : 1);
      if (target < 0 || target >= draft.levels.length) return draft;
      return setLevels(draft, swap(draft.levels, action.index, target));
    }

    case "removeLevel":
      if (draft.levels.length <= 1) return draft;
      return setLevels(
        draft,
        draft.levels.filter((_, index) => index !== action.index),
      );
  }
}
