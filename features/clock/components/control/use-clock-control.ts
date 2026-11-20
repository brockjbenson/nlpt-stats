"use client";

import { controlClockAction } from "@/features/clock/actions/clocks";
import type { LiveClock } from "@/features/clock/hooks/use-clock";
import { type ClockControl, planControl } from "@/features/clock/lib/controls";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

// Presses a control: shows its planned change at once (the same rules the
// server uses, at the screen's server-corrected time), then saves it with
// one server action. The saved row replaces the plan; a refusal reverts it
// when the action finishes and shows a toast.
export function useClockControl(
  live: LiveClock,
): (control: ClockControl) => void {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const { clock, nowMs, applyRow, showUpdate } = live;

  return (control: ClockControl): void => {
    startTransition(async () => {
      const plan = planControl(clock, control, nowMs);
      if (plan.ok) showUpdate(plan.value);

      const result = await controlClockAction(clock.id, control);
      if (result.clock) applyRow(result.clock);
      if (!result.success) {
        toast({
          title: "Couldn't update the clock",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };
}
