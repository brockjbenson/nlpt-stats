"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import type {
  DraftLevel,
  StructureError,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type React from "react";

const SECONDS_PER_MINUTE = 60;
const ICON_BUTTON_CLASS = "size-8";

type BlindField = "small_blind" | "big_blind" | "ante";

const BLIND_FIELDS: { field: BlindField; label: string }[] = [
  { field: "small_blind", label: "SB" },
  { field: "big_blind", label: "BB" },
  { field: "ante", label: "Ante" },
];

type Props = {
  level: DraftLevel;
  index: number;
  // "Level 5" or "Break".
  label: string;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

function LevelRow({
  level,
  index,
  label,
  isFirst,
  isLast,
  canRemove,
  errors,
  dispatch,
}: Props) {
  const update = (change: Partial<BlindLevel>): void =>
    dispatch({ type: "updateLevel", index, change });
  const id = (field: string): string => `level-${level.key}-${field}`;
  const isBreak = level.kind === "break";

  return (
    <li
      className={cn(
        "mb-2 flex break-inside-avoid flex-col gap-2 rounded-lg border p-2",
        isBreak ? "border-dashed border-neutral-700" : "border-neutral-800",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="w-16 shrink-0 text-sm font-semibold">{label}</p>
        <Select
          value={level.kind}
          onValueChange={(kind) => update({ kind: kind as BlindLevel["kind"] })}
        >
          <SelectTrigger
            variant="outline"
            className="h-8 w-24 px-2"
            aria-label={`${label} type`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="level">Level</SelectItem>
            <SelectItem value="break">Break</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            disabled={isFirst}
            aria-label={`Move ${label} up`}
            onClick={() =>
              dispatch({ type: "moveLevel", index, direction: "up" })
            }
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            disabled={isLast}
            aria-label={`Move ${label} down`}
            onClick={() =>
              dispatch({ type: "moveLevel", index, direction: "down" })
            }
          >
            <ArrowDown size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={ICON_BUTTON_CLASS}
            disabled={!canRemove}
            aria-label={`Remove ${label}`}
            onClick={() => dispatch({ type: "removeLevel", index })}
          >
            <Trash2 className="text-red-600" size={14} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {!isBreak &&
          BLIND_FIELDS.map(({ field, label: fieldLabel }) => (
            <CompactField key={field} htmlFor={id(field)} label={fieldLabel}>
              <NumberInput
                id={id(field)}
                min={0}
                step={25}
                value={level[field]}
                onValueChange={(value) => update({ [field]: value })}
              />
            </CompactField>
          ))}
        <CompactField htmlFor={id("minutes")} label="Min">
          <NumberInput
            id={id("minutes")}
            min={1}
            step={1}
            value={level.duration_seconds / SECONDS_PER_MINUTE}
            onValueChange={(minutes) =>
              update({ duration_seconds: minutes * SECONDS_PER_MINUTE })
            }
          />
        </CompactField>
      </div>
      <ErrorText errors={errors} />
    </li>
  );
}

export default LevelRow;
