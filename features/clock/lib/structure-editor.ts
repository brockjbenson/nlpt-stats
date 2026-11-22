import {
  DEFAULT_BREAK_SECONDS,
  DEFAULT_LEVEL_SECONDS,
  type DraftLevel,
  type SettingsFields,
  type StructureDraft,
  SUGGESTED_SPLITS,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";

// Round big blinds within each power of ten: 100, 150, 200, 300, 400, 500,
// 600, 800, 1,000, 1,500 … A suggested level moves to the next one up, a
// 25-50% raise that never doubles.
const BIG_BLIND_STEPS = [1, 1.5, 2, 3, 4, 5, 6, 8];
const FIRST_SMALL_BLIND = 100;
// Places paid beyond this get no automatic percentage inputs: a typo like
// 400 shouldn't render 400 fields.
const MAX_RESIZED_PLACES = 20;

export type SettingsNumberField =
  | "buy_in"
  | "rebuy"
  | "starting_chips"
  | "rebuy_chips"
  | "max_rebuys";

// Edits to the settings templates and new clocks share (SettingsFields).
export type SettingsAction =
  | { type: "setField"; field: "name"; value: string }
  | { type: "setField"; field: SettingsNumberField; value: number }
  | { type: "setPlacesPaid"; value: number }
  | { type: "setPayoutPct"; index: number; value: number };

// The part of a draft the level editor works on: the rows and the lengths of
// new rows. Templates (StructureDraft) and running clocks both have it.
export type LevelsDraft = Pick<
  StructureDraft,
  "levels" | "new_level_seconds" | "new_break_seconds"
>;

// New rows bring their own key so the reducer stays pure.
export type LevelsAction =
  | {
      type: "setField";
      field: "new_level_seconds" | "new_break_seconds";
      value: number;
    }
  | { type: "addLevel"; key: string }
  | { type: "addBreak"; key: string }
  | { type: "updateLevel"; index: number; change: Partial<BlindLevel> }
  // A drag and drop: the row at `from` ends up at `to`.
  | { type: "reorderLevel"; from: number; to: number }
  | { type: "removeLevel"; index: number }
  // Every row at once, as a running clock's editor lines them up with the
  // clock.
  | { type: "setLevels"; levels: DraftLevel[] };

export type StructureEditorAction = SettingsAction | LevelsAction;

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

function isLength(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds > 0;
}

// The new level length setting, or the default while it's empty or invalid.
function newLevelSeconds(draft: LevelsDraft): number {
  const seconds = draft.new_level_seconds;
  return isLength(seconds) ? seconds : DEFAULT_LEVEL_SECONDS;
}

// The new break length setting, or the default while it's empty or invalid.
function newBreakSeconds(draft: LevelsDraft): number {
  const seconds = draft.new_break_seconds;
  return isLength(seconds) ? seconds : DEFAULT_BREAK_SECONDS;
}

// The level to offer after the playing levels in `levels`: the next round
// big blind with a small blind of half that, the last level's ante, and the
// new level length.
function suggestLevel(levels: BlindLevel[], seconds: number): BlindLevel {
  const last = levels.findLast(({ kind }) => kind === "level");
  const bigBlind = last?.big_blind
    ? nextBigBlind(last.big_blind)
    : FIRST_SMALL_BLIND * 2;
  return {
    kind: "level",
    small_blind: bigBlind / 2,
    big_blind: bigBlind,
    ante: last?.ante ?? 0,
    duration_seconds: seconds,
  };
}

function breakLevel(seconds: number): BlindLevel {
  return {
    kind: "break",
    small_blind: null,
    big_blind: null,
    ante: 0,
    duration_seconds: seconds,
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
  draft: LevelsDraft,
  index: number,
  change: Partial<BlindLevel>,
): DraftLevel {
  const { levels } = draft;
  const row = levels[index];
  if (change.kind === "break" && row.kind !== "break") {
    return { ...breakLevel(newBreakSeconds(draft)), key: row.key };
  }
  if (change.kind === "level" && row.kind !== "level") {
    return {
      ...suggestLevel(levels.slice(0, index), newLevelSeconds(draft)),
      key: row.key,
    };
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

function setLevels<T extends LevelsDraft>(draft: T, levels: DraftLevel[]): T {
  return { ...draft, levels };
}

// Applies a settings edit to a template draft or a new clock's settings,
// keeping every other field as it is.
export function settingsReducer<T extends SettingsFields>(
  settings: T,
  action: SettingsAction,
): T {
  switch (action.type) {
    case "setField":
      return { ...settings, [action.field]: action.value };

    case "setPlacesPaid":
      return {
        ...settings,
        places_paid: action.value,
        payout_pcts: resizePayouts(settings.payout_pcts, action.value),
      };

    case "setPayoutPct":
      return {
        ...settings,
        payout_pcts: settings.payout_pcts.map((pct, index) =>
          index === action.index ? action.value : pct,
        ),
      };
  }
}

// Applies a level edit to anything with levels (a template draft or a running
// clock's levels), keeping every other field as it is. Knows nothing about
// locked rows: the editor stops those edits before they get here.
export function levelsReducer<T extends LevelsDraft>(
  draft: T,
  action: LevelsAction,
): T {
  switch (action.type) {
    case "setField":
      return { ...draft, [action.field]: action.value };

    case "addLevel":
      return setLevels(draft, [
        ...draft.levels,
        {
          ...suggestLevel(draft.levels, newLevelSeconds(draft)),
          key: action.key,
        },
      ]);

    case "addBreak":
      return setLevels(draft, [
        ...draft.levels,
        { ...breakLevel(newBreakSeconds(draft)), key: action.key },
      ]);

    case "updateLevel":
      return setLevels(
        draft,
        draft.levels.map((row, index) =>
          index === action.index
            ? changeLevel(draft, index, action.change)
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

    case "setLevels":
      return setLevels(draft, action.levels);
  }
}

export function structureEditorReducer(
  draft: StructureDraft,
  action: StructureEditorAction,
): StructureDraft {
  switch (action.type) {
    case "setField":
      return action.field === "new_level_seconds" ||
        action.field === "new_break_seconds"
        ? levelsReducer(draft, action)
        : { ...draft, [action.field]: action.value };

    case "setPlacesPaid":
    case "setPayoutPct":
      return settingsReducer(draft, action);

    case "addLevel":
    case "addBreak":
    case "updateLevel":
    case "reorderLevel":
    case "removeLevel":
    case "setLevels":
      return levelsReducer(draft, action);
  }
}
