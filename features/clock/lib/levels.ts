import type { BlindLevel } from "@/features/clock/types";

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const NOTE_MAX_LENGTH = 100;

type LevelRow = Record<string, unknown>;

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

// A note with the spaces trimmed off, or null when there's no text.
export function cleanNote(note: unknown): string | null {
  if (typeof note !== "string") return null;
  const trimmed = note.trim();
  return trimmed === "" ? null : trimmed;
}

// Why a row's note breaks the rules (breaks only, up to 100 characters),
// or null when it's fine.
function noteProblem(row: LevelRow): string | null {
  if (row.note == null) return null;
  if (typeof row.note !== "string") return "note must be text";
  const note = cleanNote(row.note);
  if (note !== null && row.kind !== "break")
    return "only a break can have a note";
  if (note !== null && note.length > NOTE_MAX_LENGTH) {
    return `Keep break notes to ${NOTE_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

// Why a row breaks the _blind_levels rules, or null when it's valid.
export function levelProblem(row: LevelRow): string | null {
  if (row.kind !== "level" && row.kind !== "break") return "unknown kind";
  const notesIssue = noteProblem(row);
  if (notesIssue) return notesIssue;
  if (!isPositiveInteger(row.duration_seconds)) {
    return "duration_seconds must be a positive whole number";
  }
  if (!isNonNegativeInteger(row.ante)) {
    return "ante must be a whole number of 0 or more";
  }
  if (row.kind === "break") {
    return row.small_blind == null && row.big_blind == null
      ? null
      : "a break can't have blinds";
  }
  if (!isPositiveInteger(row.small_blind)) {
    return "small_blind must be a positive whole number";
  }
  if (!isPositiveInteger(row.big_blind) || row.big_blind < row.small_blind) {
    return "big_blind must be a whole number of at least small_blind";
  }
  return null;
}

// Validates a _tournament_clocks.levels payload with the same rules as
// _blind_levels. Throws on bad data: the database should never hold any.
export function parseLevels(value: unknown): BlindLevel[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("levels must be a non-empty array");
  }
  return value.map((row: unknown, index: number): BlindLevel => {
    if (typeof row !== "object" || row === null) {
      throw new Error(`levels index ${index}: not an object`);
    }
    const problem = levelProblem(row as LevelRow);
    if (problem) throw new Error(`levels index ${index}: ${problem}`);

    const level = row as BlindLevel;
    return {
      kind: level.kind,
      small_blind: level.small_blind ?? null,
      big_blind: level.big_blind ?? null,
      ante: level.ante,
      duration_seconds: level.duration_seconds,
      // Only rows that have a note field get one, so older snapshots
      // without notes read back unchanged.
      ...("note" in level && { note: cleanNote(level.note) }),
    };
  });
}

export function levelDurationMs(level: BlindLevel): number {
  return level.duration_seconds * MS_PER_SECOND;
}

export function scheduleLengthMs(levels: BlindLevel[]): number {
  return levels.reduce((total, level) => total + levelDurationMs(level), 0);
}

// The 1-based number players call a level ("level 5"), counting playing
// levels only. Null for a break or an index outside the schedule.
export function levelNumber(
  levels: BlindLevel[],
  index: number,
): number | null {
  if (levels[index]?.kind !== "level") return null;
  return levels.slice(0, index + 1).filter((level) => level.kind === "level")
    .length;
}
