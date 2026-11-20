"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ClockControl } from "@/features/clock/lib/controls";
import type { ClockView } from "@/features/clock/lib/display";
import { Minus, Pause, Play, Plus, SkipBack, SkipForward } from "lucide-react";

const MAIN_BUTTON = "h-14 w-full text-base";
const STEP_BUTTON = "h-12 flex-1";

type Props = {
  view: ClockView;
  // A control is being saved; every button waits for it.
  isPending: boolean;
  onControl: (control: ClockControl) => void;
};

// Start asks first, since it starts the tournament for everyone watching.
function StartButton({
  disabled,
  onStart,
}: {
  disabled: boolean;
  onStart: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={MAIN_BUTTON} disabled={disabled}>
          <Play /> Start
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start the clock?</AlertDialogTitle>
          <AlertDialogDescription>
            Level 1 begins now on every screen showing this clock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onStart}>Start</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Start, pause/resume, previous/next level and a minute more or less.
// Only the controls that apply to the clock's state are enabled.
function ControlButtons({ view, isPending, onControl }: Props) {
  const { status, position } = view;
  const isLive = status === "running" || status === "paused";
  const canStep = isLive && !isPending;

  return (
    <div className="flex flex-col gap-2">
      {status === "setup" && (
        <StartButton
          disabled={isPending}
          onStart={() => onControl({ type: "start" })}
        />
      )}
      {status === "running" && (
        <Button
          className={MAIN_BUTTON}
          variant="neutral"
          disabled={isPending}
          onClick={() => onControl({ type: "pause" })}
        >
          <Pause /> Pause
        </Button>
      )}
      {status === "paused" && (
        <Button
          className={MAIN_BUTTON}
          disabled={isPending}
          onClick={() => onControl({ type: "resume" })}
        >
          <Play /> Resume
        </Button>
      )}
      <div className="flex gap-2">
        <Button
          className={STEP_BUTTON}
          variant="outline"
          disabled={!canStep || position.levelIndex === 0}
          onClick={() => onControl({ type: "previous" })}
        >
          <SkipBack /> Previous level
        </Button>
        <Button
          className={STEP_BUTTON}
          variant="outline"
          disabled={!canStep || position.isLastLevel}
          onClick={() => onControl({ type: "next" })}
        >
          Next level <SkipForward />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          className={STEP_BUTTON}
          variant="outline"
          disabled={!canStep}
          aria-label="Remove 1 minute"
          onClick={() => onControl({ type: "adjust", minutes: -1 })}
        >
          <Minus /> 1 min
        </Button>
        <Button
          className={STEP_BUTTON}
          variant="outline"
          disabled={!canStep}
          aria-label="Add 1 minute"
          onClick={() => onControl({ type: "adjust", minutes: 1 })}
        >
          <Plus /> 1 min
        </Button>
      </div>
    </div>
  );
}

export default ControlButtons;
