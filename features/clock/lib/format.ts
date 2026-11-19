import { MS_PER_SECOND } from "@/features/clock/lib/levels";
import type { BlindLevel } from "@/features/clock/types";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
const MINUTES_PER_HOUR = 60;

const chipCount = new Intl.NumberFormat("en-US");
const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dollarsAndCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// "20,000"
export function formatChips(chips: number): string {
  return chipCount.format(chips);
}

// "$40", or "$12.50" when there are cents.
export function formatDollars(amount: number): string {
  return Number.isInteger(amount)
    ? wholeDollars.format(amount)
    : dollarsAndCents.format(amount);
}

// A schedule length: "5h 50m", "20m", "1h". Rounds to the nearest minute.
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// "15:00", or "1:05:00" from an hour. Rounds up to the whole second, so
// the display shows 0:01 until time is really up.
export function formatClockTime(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) return `${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
  return `${minutes}:${twoDigits(seconds)}`;
}

// Time into the tournament: "0:20", "1:20", "5:30" (hours:minutes).
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  return `${hours}:${twoDigits(totalMinutes % MINUTES_PER_HOUR)}`;
}

// "1,000 / 2,000", with " (ante 200)" when there's an ante, or "Break".
export function formatBlinds(level: BlindLevel): string {
  if (level.kind === "break") return "Break";
  const blinds = `${formatChips(level.small_blind ?? 0)} / ${formatChips(level.big_blind ?? 0)}`;
  return level.ante > 0
    ? `${blinds} (ante ${formatChips(level.ante)})`
    : blinds;
}

const ordinalRules = new Intl.PluralRules("en-US", { type: "ordinal" });
const ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
  zero: "th",
  one: "st",
  two: "nd",
  few: "rd",
  many: "th",
  other: "th",
};

// A finishing place: "1st", "2nd", "3rd", "11th", "22nd".
export function ordinal(place: number): string {
  return `${place}${ORDINAL_SUFFIXES[ordinalRules.select(place)]}`;
}
