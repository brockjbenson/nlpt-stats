"use client";

import type { PlayersActionResult } from "@/features/clock/actions/entrants";
import {
  type RunAction,
  useActionWithToast,
} from "@/features/clock/hooks/use-action-with-toast";
import type { LivePlayers } from "@/features/clock/hooks/use-entrants";

export type RunPlayerAction = RunAction<PlayersActionResult>;

// Runs a player action: shows the lists it saved at once (before their
// Realtime events), or a toast with the reason it was refused.
export function usePlayerAction(applyResult: LivePlayers["applyResult"]): {
  run: RunPlayerAction;
  isPending: boolean;
} {
  return useActionWithToast<PlayersActionResult>(applyResult);
}
