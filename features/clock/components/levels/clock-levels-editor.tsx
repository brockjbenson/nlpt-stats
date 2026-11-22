"use client";

import { BottomTabAccessory } from "@/components/bottom-tabs/accessory";
import { Spinner } from "@/components/ui/spinner";
import {
  type ClockControlResult,
  updateClockLevelsAction,
} from "@/features/clock/actions/clocks";
import LevelsFields from "@/features/clock/components/structures/levels-fields";
import { useActionWithToast } from "@/features/clock/hooks/use-action-with-toast";
import { useClock } from "@/features/clock/hooks/use-clock";
import { useLeaveWarning } from "@/features/clock/hooks/use-leave-warning";
import { clockStatusLabel } from "@/features/clock/lib/clocks";
import type { ClockView } from "@/features/clock/lib/display";
import {
  clockLevelsDraft,
  levelEditLocks,
  levelsChanged,
} from "@/features/clock/lib/level-edits";
import { clockControlPath } from "@/features/clock/lib/paths";
import {
  type LevelsDraft,
  levelsReducer,
} from "@/features/clock/lib/structure-editor";
import { validateLevels } from "@/features/clock/lib/structures";
import type { TournamentClock } from "@/features/clock/types";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useRef } from "react";

type Props = {
  initialClock: TournamentClock;
  // The database time the page was rendered at.
  initialNowMs: number;
};

// The editor's starting draft. The clock's own rows are keyed "saved-1",
// "saved-2", …; rows added later get "new-row-N" from nextKey, so keys never
// clash.
function startDraft(clock: TournamentClock): LevelsDraft {
  let count = 0;
  return clockLevelsDraft(clock, () => {
    count += 1;
    return `saved-${count}`;
  });
}

// The clock's name, and the level being played with its time left, as the
// display shows them.
function LiveLine({ name, view }: { name: string; view: ClockView }) {
  const isRunning = view.status === "running";
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 className="min-w-0 truncate font-semibold">{name}</h2>
      <p className="shrink-0 text-sm text-muted tabular-nums">
        {view.title} ·{" "}
        <span className={cn("font-semibold", isRunning && "text-foreground")}>
          {view.timeText}
        </span>
        {!isRunning && ` · ${clockStatusLabel(view.status)}`}
      </p>
    </div>
  );
}

// Edits a clock's current and upcoming levels and saves them in one go,
// then returns to the control screen. Played levels are locked, and the
// locks follow the clock live, so a level that ends while editing locks
// itself. Edits stay local until Save; Realtime changes never replace them.
function ClockLevelsEditor({ initialClock, initialNowMs }: Props) {
  const router = useRouter();
  const { clock, view, isDeleted, applyRow } = useClock(
    initialClock,
    initialNowMs,
  );
  const [draft, dispatch] = useReducer(
    levelsReducer<LevelsDraft>,
    initialClock,
    startDraft,
  );
  const keyCount = useRef(0);
  const nextKey = (): string => {
    keyCount.current += 1;
    return `new-row-${keyCount.current}`;
  };
  const { run, isPending } = useActionWithToast<ClockControlResult>(
    (result) => result.clock && applyRow(result.clock),
  );

  // Null once the clock is finished: nothing can change.
  const locks = levelEditLocks(view.status, view.position.levelIndex);
  const canEdit = locks !== null && !isDeleted;
  const isDirty = levelsChanged(clock.levels, draft.levels);
  useLeaveWarning(canEdit && isDirty && !isPending);

  const firstEditable = locks?.firstEditable ?? 0;
  // Played rows are never saved, so their problems don't matter.
  const errors = validateLevels(draft.levels).filter(
    ({ levelIndex }) => levelIndex === undefined || levelIndex >= firstEditable,
  );
  const canSave = isDirty && errors.length === 0 && !isPending;
  // "Now playing" only once the clock has started.
  const currentIndex =
    view.status === "running" || view.status === "paused"
      ? view.position.levelIndex
      : undefined;

  const save = (): void => {
    run(
      "Couldn't save the levels",
      () => updateClockLevelsAction(clock.id, draft.levels),
      () => router.push(clockControlPath(clock.id)),
    );
  };

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      <Link
        href={clockControlPath(clock.id)}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
      >
        <ChevronLeft size={16} /> Clock
      </Link>
      {!canEdit ? (
        <p className="py-8 text-center text-muted">
          {isDeleted ? "This clock was deleted." : "This clock is finished."}
        </p>
      ) : (
        <>
          <LiveLine name={clock.name} view={view} />
          <LevelsFields
            draft={draft}
            errors={errors}
            dispatch={dispatch}
            nextKey={nextKey}
            locks={locks}
            currentIndex={currentIndex}
          />
          <BottomTabAccessory
            className={cn(
              "transition-[filter] duration-150",
              canSave ? "border-primary" : "border-neutral-700",
            )}
          >
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className={cn(
                "flex size-full items-center justify-center text-sm font-semibold",
                canSave
                  ? "bg-primary text-white"
                  : "cursor-not-allowed text-muted",
              )}
            >
              {isPending ? <Spinner /> : isDirty ? "Save Levels" : "No Changes"}
            </button>
          </BottomTabAccessory>
        </>
      )}
    </div>
  );
}

export default ClockLevelsEditor;
