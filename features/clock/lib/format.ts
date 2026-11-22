import {
  MS_PER_MINUTE,
  MS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from "@/features/clock/lib/levels";
import { summarizeLevels } from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";

const SECONDS_PER_HOUR = 3600;
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
// Where the league plays. Servers run in UTC, so dates are read in this
// zone: a 7 pm game is still that day, not the next.
const LEAGUE_TIME_ZONE = "America/Chicago";
const leagueDate = new Intl.DateTimeFormat("en-US", {
  timeZone: LEAGUE_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

// "1 level", "3 levels".
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

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

// A day in the league's time zone: "Nov 27, 2026".
export function formatClockDate(ms: number): string {
  return leagueDate.format(ms);
}

// en-CA writes dates as yyyy-mm-dd.
const leagueIsoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: LEAGUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The calendar day in the league's time zone, as yyyy-mm-dd: a game at
// 7:30 pm Central on Nov 27 is Nov 27, though it's Nov 28 in UTC.
export function formatLeagueIsoDate(ms: number): string {
  return leagueIsoDate.format(ms);
}

// A schedule length: "5h 50m", "20m", "1h". Rounds to the nearest minute.
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// "18 levels · 3 breaks · 5h 20m". A length that isn't a number (a row being
// typed) shows as a dash.
export function formatLevelsSummary(levels: BlindLevel[]): string {
  const { levelCount, breakCount, lengthMs } = summarizeLevels(levels);
  const length = Number.isFinite(lengthMs) ? formatDuration(lengthMs) : "—";
  return `${plural(levelCount, "level")} · ${plural(breakCount, "break")} · ${length}`;
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

// "1,000 / 2,000": the small and big blind, without the ante.
export function formatBlindPair(level: BlindLevel): string {
  return `${formatChips(level.small_blind ?? 0)} / ${formatChips(level.big_blind ?? 0)}`;
}

// "1,000 / 2,000", with " (ante 200)" when there's an ante, or "Break".
export function formatBlinds(level: BlindLevel): string {
  if (level.kind === "break") return "Break";
  const blinds = formatBlindPair(level);
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
