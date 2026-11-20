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
import type { ClockStatus } from "@/features/clock/types";
import { Minus, Pause, Play, Plus, SkipBack, SkipForward } from "lucide-react";

const MAIN_BUTTON_CLASS = "h-14 w-full text-base";
const STEP_BUTTON_CLASS = "h-12 flex-1";

type Props = {
  // The clock as shown, with any press still being saved already applied,
  // so presses can follow each other without waiting.
  view: ClockView;
  onControl: (control: ClockControl) => void;
};

// Start asks first, since it starts the tournament for everyone watching.
function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={MAIN_BUTTON_CLASS}>
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

// The big button: Start before the clock starts, then Pause or Resume.
// None once the clock has finished.
function MainButton({
  status,
  onControl,
}: {
  status: ClockStatus;
  onControl: (control: ClockControl) => void;
}) {
  switch (status) {
    case "setup":
      return <StartButton onStart={() => onControl({ type: "start" })} />;
    case "running":
      return (
        <Button
          className={MAIN_BUTTON_CLASS}
          variant="neutral"
          onClick={() => onControl({ type: "pause" })}
        >
          <Pause /> Pause
        </Button>
      );
    case "paused":
      return (
        <Button
          className={MAIN_BUTTON_CLASS}
          onClick={() => onControl({ type: "resume" })}
        >
          <Play /> Resume
        </Button>
      );
    case "finished":
      return null;
  }
}

// Start, pause/resume, previous/next level and a minute more or less.
// Only the controls that apply to the clock's state are enabled.
function ControlButtons({ view, onControl }: Props) {
  const { status, position } = view;
  const canStep = status === "running" || status === "paused";

  return (
    <div className="flex flex-col gap-2">
      <MainButton status={status} onControl={onControl} />
      <div className="flex gap-2">
        <Button
          className={STEP_BUTTON_CLASS}
          variant="outline"
          disabled={!canStep || position.levelIndex === 0}
          onClick={() => onControl({ type: "previous" })}
        >
          <SkipBack /> Previous level
        </Button>
        <Button
          className={STEP_BUTTON_CLASS}
          variant="outline"
          disabled={!canStep || position.isLastLevel}
          onClick={() => onControl({ type: "next" })}
        >
          Next level <SkipForward />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          className={STEP_BUTTON_CLASS}
          variant="outline"
          disabled={!canStep}
          aria-label="Remove 1 minute"
          onClick={() => onControl({ type: "adjust", minutes: -1 })}
        >
          <Minus /> 1 min
        </Button>
        <Button
          className={STEP_BUTTON_CLASS}
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
