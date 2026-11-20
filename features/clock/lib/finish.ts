import { planFinish } from "@/features/clock/lib/entrants";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import { getClockPosition } from "@/features/clock/lib/timing";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";

export type FinishRefusal = "wrong_status" | "players_remaining" | "no_players";

// What finish_tournament_clock saves: the winner (placed 1st) and where
// the clock stopped.
export type PlannedFinish = {
  winnerId: string;
  finishedAt: string;
  levelIndex: number;
  remainingMs: number;
};

// Ending the tournament: only while the clock is running or paused, and
// only once one player is left, who wins. The clock stops where it has got
// to (caught up, if levels ran out while nobody saved them).
export function planFinishClock(
  clock: TournamentClock,
  entrants: ClockEntrant[],
  nowMs: number,
): Result<PlannedFinish, FinishRefusal> {
  if (clock.status !== "running" && clock.status !== "paused") {
    return fail("wrong_status");
  }
  const winner = planFinish(entrants);
  if (!winner.ok) return winner;

  const position = getClockPosition(clock, nowMs);
  return ok({
    winnerId: winner.value.entrantId,
    finishedAt: new Date(nowMs).toISOString(),
    levelIndex: position.levelIndex,
    remainingMs: position.remainingMs,
  });
}

// A finish pressed by mistake can be undone until the results are saved.
export function canReopen(
  clock: Pick<TournamentClock, "status" | "tournament_id">,
): boolean {
  return clock.status === "finished" && clock.tournament_id === null;
}

const FINISH_MESSAGES: Record<FinishRefusal, string> = {
  wrong_status: "Only a running or paused clock can end.",
  players_remaining: "Bust players until one is left.",
  no_players: "Add players before ending the tournament.",
};

export function finishRefusalMessage(reason: FinishRefusal): string {
  return FINISH_MESSAGES[reason];
}
