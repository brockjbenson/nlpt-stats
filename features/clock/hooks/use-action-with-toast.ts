"use client";

import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

type ActionResult = { success: boolean; message: string };

export type RunAction<R extends ActionResult> = (
  failureTitle: string,
  action: () => Promise<R>,
  onSuccess?: () => void,
) => void;

// Runs a server action from the control screen: applies what it returned
// (the saved rows, so the screen updates before their Realtime events),
// then calls onSuccess, or shows a toast with the reason it was refused.
export function useActionWithToast<R extends ActionResult>(
  apply: (result: R) => void,
): { run: RunAction<R>; isPending: boolean } {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const run: RunAction<R> = (failureTitle, action, onSuccess) => {
    startTransition(async () => {
      const result = await action();
      apply(result);
      if (result.success) {
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
