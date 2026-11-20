"use client";

import { catchUpClockAction } from "@/features/clock/actions/clocks";
import type { TournamentClock } from "@/features/clock/types";
import { useEffect, useRef } from "react";

// When time runs out on a level while this control screen is open, saves
// the new level once. The action only writes while the saved level is
// still the one it saw, so other open admin screens don't save it twice.
// Each saved level is sent once; a failed save is left to the next level
// or another screen rather than retried every tick.
export function useCatchUp(
  clock: TournamentClock,
  effectiveLevelIndex: number,
  applyRow: (clock: TournamentClock) => void,
): void {
  const lastSentFor = useRef<number | null>(null);
  const { id, status, level_index: savedLevelIndex } = clock;

  useEffect(() => {
    if (status !== "running" || effectiveLevelIndex <= savedLevelIndex) return;
    if (lastSentFor.current === savedLevelIndex) return;
    lastSentFor.current = savedLevelIndex;

    void catchUpClockAction(id, savedLevelIndex).then((result) => {
      if (result.clock) applyRow(result.clock);
    });
  }, [id, status, savedLevelIndex, effectiveLevelIndex, applyRow]);
}
