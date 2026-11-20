import { describeClock } from "@/features/clock/lib/display";
import type { ClockStatus, TournamentClock } from "@/features/clock/types";

// What the "Tournament live" banner says about a clock.
export type LiveClockText = {
  name: string;
  // "Level 5", "Break" or "Paused".
  detail: string;
  // The countdown ("12:34") while running; null while paused.
  time: string | null;
};

// The statuses a live clock can have, in the order the banner prefers them:
// running before paused.
export const LIVE_STATUSES: ClockStatus[] = ["running", "paused"];

function isLive(clock: TournamentClock): boolean {
  return LIVE_STATUSES.includes(clock.status);
}

// Running first, then the newest.
function compareLive(a: TournamentClock, b: TournamentClock): number {
  const byStatus =
    LIVE_STATUSES.indexOf(a.status) - LIVE_STATUSES.indexOf(b.status);
  if (byStatus !== 0) return byStatus;
  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

// The clock the banner shows: a running or paused one (setup and finished
// clocks aren't live), preferring running, then the newest. Null when none
// is live.
export function pickLiveClock(
  clocks: TournamentClock[],
): TournamentClock | null {
  return clocks.filter(isLive).sort(compareLive)[0] ?? null;
}

// The banner's text at one moment, using the display's level and time.
export function describeLiveClock(
  clock: TournamentClock,
  nowMs: number,
): LiveClockText {
  if (clock.status === "paused") {
    return { name: clock.name, detail: "Paused", time: null };
  }
  const view = describeClock(clock, nowMs);
  return { name: clock.name, detail: view.title, time: view.timeText };
}
