"use client";

import type { PlayersActionResult } from "@/features/clock/actions/entrants";
import type { LivePlayers } from "@/features/clock/hooks/use-entrants";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

export type RunPlayerAction = (
  failureTitle: string,
  action: () => Promise<PlayersActionResult>,
  onSuccess?: () => void,
) => void;

// Runs a player action: shows the lists it saved at once (before their
// Realtime events), or a toast with the reason it was refused.
export function usePlayerAction(applyResult: LivePlayers["applyResult"]): {
  run: RunPlayerAction;
  isPending: boolean;
} {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const run: RunPlayerAction = (failureTitle, action, onSuccess) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        applyResult(result);
        onSuccess?.();
        return;
      }
      toast({
        title: failureTitle,
        description: result.message,
        variant: "destructive",
      });
    });
  };

  return { run, isPending };
}
