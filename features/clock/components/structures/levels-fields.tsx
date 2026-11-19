"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorText from "@/features/clock/components/structures/error-text";
import LevelRow from "@/features/clock/components/structures/level-row";
import { formatDuration } from "@/features/clock/lib/format";
import { levelNumber } from "@/features/clock/lib/levels";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import {
  type StructureDraft,
  type StructureError,
  summarizeLevels,
} from "@/features/clock/lib/structures";
import { Coffee, Plus } from "lucide-react";
import type React from "react";

type Props = {
  draft: StructureDraft;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
  // A fresh React key for each new row.
  nextKey: () => string;
};

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function LevelsFields({ draft, errors, dispatch, nextKey }: Props) {
  const { levels } = draft;
  const { levelCount, breakCount, lengthMs } = summarizeLevels(levels);
  const levelErrors = errors.filter(({ field }) => field === "levels");

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Levels</CardTitle>
        <p className="text-sm text-muted">
          {plural(levelCount, "level")} · {plural(breakCount, "break")} ·{" "}
          {Number.isFinite(lengthMs) ? formatDuration(lengthMs) : "—"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <ol>
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
              isFirst={index === 0}
              isLast={index === levels.length - 1}
              canRemove={levels.length > 1}
              errors={levelErrors.filter(
                ({ levelIndex }) => levelIndex === index,
              )}
              dispatch={dispatch}
            />
          ))}
        </ol>
        <ErrorText
          errors={levelErrors.filter(
            ({ levelIndex }) => levelIndex === undefined,
          )}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "addLevel", key: nextKey() })}
          >
            <Plus size={16} /> Add Level
          </Button>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "addBreak", key: nextKey() })}
          >
            <Coffee size={16} /> Add Break
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LevelsFields;
