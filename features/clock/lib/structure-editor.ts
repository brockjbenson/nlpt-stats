import {
  type DraftLevel,
  type StructureDraft,
  SUGGESTED_SPLITS,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";

const BREAK_SECONDS = 10 * 60;
// Round big blinds within each power of ten: 100, 150, 200, 300, 400, 500,
// 600, 800, 1,000, 1,500 … A suggested level moves to the next one up, a
// 25-50% raise that never doubles.
const BIG_BLIND_STEPS = [1, 1.5, 2, 3, 4, 5, 6, 8];
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
  // A drag and drop: the row at `from` ends up at `to`.
  | { type: "reorderLevel"; from: number; to: number }
  | { type: "removeLevel"; index: number };

// The next round big blind above bigBlind (30,000 → 40,000, 350 → 400).
export function nextBigBlind(bigBlind: number): number {
  const power = Math.floor(Math.log10(bigBlind));
  const candidates = [power, power + 1].flatMap((exponent) =>
    BIG_BLIND_STEPS.map((step) => Math.round(step * 10 ** exponent)),
  );
  // 10^(power + 1) is always above bigBlind, so there's always a next step.
  return (
    candidates.find((candidate) => candidate > bigBlind) ?? 10 ** (power + 1)
  );
}

// The level to offer after the playing levels in `levels`: same length and
// ante, the next round big blind, and a small blind of half that.
function suggestLevel(levels: BlindLevel[]): BlindLevel {
  const last = levels.findLast(({ kind }) => kind === "level");
  if (!last?.big_blind) return FIRST_LEVEL;
  const bigBlind = nextBigBlind(last.big_blind);
  return {
    kind: "level",
    small_blind: bigBlind / 2,
    big_blind: bigBlind,
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

// The row at `from` moved to `to`, everything else keeping its order.
function moveTo<T>(items: T[], from: number, to: number): T[] {
  const moved = [...items];
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);
  return moved;
}

function isRowIndex(levels: DraftLevel[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < levels.length;
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

    case "reorderLevel": {
      const { from, to } = action;
      const valid =
        from !== to &&
        isRowIndex(draft.levels, from) &&
        isRowIndex(draft.levels, to);
      if (!valid) return draft;
      return setLevels(draft, moveTo(draft.levels, from, to));
    }

    case "removeLevel":
      if (draft.levels.length <= 1) return draft;
      return setLevels(
        draft,
        draft.levels.filter((_, index) => index !== action.index),
      );
  }
}
