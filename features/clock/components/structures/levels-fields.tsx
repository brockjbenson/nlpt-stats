"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorText from "@/features/clock/components/structures/error-text";
import LevelRow from "@/features/clock/components/structures/level-row";
import { formatDuration, plural } from "@/features/clock/lib/format";
import { levelNumber } from "@/features/clock/lib/levels";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import {
  levelStartTimes,
  type StructureDraft,
  type StructureError,
  summarizeLevels,
} from "@/features/clock/lib/structures";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Coffee, Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";

type Props = {
  draft: StructureDraft;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
  // A fresh React key for each new row.
  nextKey: () => string;
};

function LevelsFields({ draft, errors, dispatch, nextKey }: Props) {
  const { levels } = draft;
  const { levelCount, breakCount, lengthMs } = summarizeLevels(levels);
  const levelErrors = errors.filter(({ field }) => field === "levels");
  const keys = levels.map(({ key }) => key);
  const startTimes = levelStartTimes(levels);
  // The one stop whose fields are open, if any.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const sensors = useSensors(
    // A small move starts a drag, so tapping the handle doesn't.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const reorder = ({ active, over }: DragEndEvent): void => {
    if (!over) return;
    dispatch({
      type: "reorderLevel",
      from: keys.indexOf(String(active.id)),
      to: keys.indexOf(String(over.id)),
    });
  };

  // New rows open so their numbers can be set straight away.
  const add = (type: "addLevel" | "addBreak"): void => {
    const key = nextKey();
    dispatch({ type, key });
    setExpandedKey(key);
  };

  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-baseline justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Levels</CardTitle>
        <p className="text-xs text-muted">
          {plural(levelCount, "level")} · {plural(breakCount, "break")} ·{" "}
          {Number.isFinite(lengthMs) ? formatDuration(lengthMs) : "—"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <DndContext
          id="structure-levels"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={reorder}
        >
          <SortableContext items={keys} strategy={verticalListSortingStrategy}>
            <ol className="max-w-3xl">
              {levels.map((level, index) => (
                <LevelRow
                  key={level.key}
                  level={level}
                  index={index}
                  label={
                    level.kind === "break"
                      ? "Break"
                      : `Level ${levelNumber(levels, index)}`
                  }
                  startMs={startTimes[index]}
                  isFirst={index === 0}
                  isLast={index === levels.length - 1}
                  isExpanded={expandedKey === level.key}
                  onToggle={() =>
                    setExpandedKey((current) =>
                      current === level.key ? null : level.key,
                    )
                  }
                  canRemove={levels.length > 1}
                  errors={levelErrors.filter(
                    ({ levelIndex }) => levelIndex === index,
                  )}
                  dispatch={dispatch}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <ErrorText
          errors={levelErrors.filter(
            ({ levelIndex }) => levelIndex === undefined,
          )}
        />
        <div className="flex gap-2 pl-[4.5rem]">
          <Button variant="outline" size="sm" onClick={() => add("addLevel")}>
            <Plus size={16} /> Add Level
          </Button>
          <Button variant="outline" size="sm" onClick={() => add("addBreak")}>
            <Coffee size={16} /> Add Break
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LevelsFields;
