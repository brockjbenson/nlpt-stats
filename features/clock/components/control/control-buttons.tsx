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
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { TbPlayerPauseFilled, TbPlayerPlayFilled } from "react-icons/tb";

// Round, icon-only buttons in three sizes: ± beside the countdown, the
// level arrows, and play/pause between them.
const ROUND_CLASS = "rounded-full p-0";
const TIME_BUTTON_CLASS = `${ROUND_CLASS} size-11 [&_svg]:size-5`;
const LEVEL_BUTTON_CLASS = `${ROUND_CLASS} size-14 [&_svg]:size-6`;
const MAIN_BUTTON_CLASS = `${ROUND_CLASS} size-20 [&_svg]:size-9`;
// Solid, rounded play and pause (Tabler's filled player icons). The play
// triangle's weight sits left of its box; nudge it to look centred.
const PLAY_ICON_CLASS = "translate-x-0.5";

type OnControl = (control: ClockControl) => void;

// Steps and time changes only apply once the clock has started and until
// it finishes.
function isLive(status: ClockStatus): boolean {
  return status === "running" || status === "paused";
}

// Start asks first, since it starts the tournament for everyone watching.
function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={MAIN_BUTTON_CLASS} aria-label="Start">
          <TbPlayerPlayFilled className={PLAY_ICON_CLASS} />
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

// The big round button: Start before the clock starts, then Pause or
// Resume. Shown but disabled once the clock has finished, so the row keeps
// its shape.
function MainButton({
  status,
  onControl,
}: {
  status: ClockStatus;
  onControl: OnControl;
}) {
  switch (status) {
    case "setup":
      return <StartButton onStart={() => onControl({ type: "start" })} />;
    case "running":
      return (
        <Button
          className={MAIN_BUTTON_CLASS}
          variant="neutral"
          aria-label="Pause"
          onClick={() => onControl({ type: "pause" })}
        >
          <TbPlayerPauseFilled />
        </Button>
      );
    case "paused":
      return (
        <Button
          className={MAIN_BUTTON_CLASS}
          aria-label="Resume"
          onClick={() => onControl({ type: "resume" })}
        >
          <TbPlayerPlayFilled className={PLAY_ICON_CLASS} />
        </Button>
      );
    case "finished":
      return (
        <Button className={MAIN_BUTTON_CLASS} aria-label="Finished" disabled>
          <TbPlayerPlayFilled className={PLAY_ICON_CLASS} />
        </Button>
      );
  }
}

// − or + a minute, beside the countdown.
export function AdjustTimeButton({
  minutes,
  view,
  onControl,
}: {
  minutes: 1 | -1;
  view: ClockView;
  onControl: OnControl;
}) {
  const isAdding = minutes > 0;
  return (
    <Button
      className={TIME_BUTTON_CLASS}
      variant="outline"
      disabled={!isLive(view.status)}
      aria-label={isAdding ? "Add 1 minute" : "Remove 1 minute"}
      onClick={() => onControl({ type: "adjust", minutes })}
    >
      {isAdding ? <Plus /> : <Minus />}
    </Button>
  );
}

// Previous level, play/pause, next level, in one row. Only the controls
// that apply to the clock's state are enabled.
export function PlaybackControls({
  view,
  onControl,
}: {
  // The clock as shown, with any press still being saved already applied,
  // so presses can follow each other without waiting.
  view: ClockView;
  onControl: OnControl;
}) {
  const { status, position } = view;
  const canStep = isLive(status);

  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      <Button
        className={LEVEL_BUTTON_CLASS}
        variant="outline"
        aria-label="Previous level"
        disabled={!canStep || position.levelIndex === 0}
        onClick={() => onControl({ type: "previous" })}
      >
        <ChevronLeft />
      </Button>
      <MainButton status={status} onControl={onControl} />
      <Button
        className={LEVEL_BUTTON_CLASS}
        variant="outline"
        aria-label="Next level"
        disabled={!canStep || position.isLastLevel}
        onClick={() => onControl({ type: "next" })}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
