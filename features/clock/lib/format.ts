import { MS_PER_SECOND } from "@/features/clock/lib/levels";
import type { BlindLevel } from "@/features/clock/types";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const chipCount = new Intl.NumberFormat("en-US");

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

// "1,000 / 2,000", with " (ante 200)" when there's an ante, or "Break".
export function formatBlinds(level: BlindLevel): string {
  if (level.kind === "break") return "Break";
  const blinds = `${chipCount.format(level.small_blind ?? 0)} / ${chipCount.format(level.big_blind ?? 0)}`;
  return level.ante > 0
    ? `${blinds} (ante ${chipCount.format(level.ante)})`
    : blinds;
}
