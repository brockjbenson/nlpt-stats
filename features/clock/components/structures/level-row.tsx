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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type React from "react";

const SECONDS_PER_MINUTE = 60;
const ICON_BUTTON_CLASS = "size-8";
// Break rows: a solid primary tint over the card, so a dragged break still
// covers the rows it passes over.
const BREAK_ROW_CLASS =
  "border-primary/50 bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]";

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
  canRemove: boolean;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

function LevelRow({ level, index, label, canRemove, errors, dispatch }: Props) {
  const update = (change: Partial<BlindLevel>): void =>
    dispatch({ type: "updateLevel", index, change });
  const id = (field: string): string => `level-${level.key}-${field}`;
  const isBreak = level.kind === "break";
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.key });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "mb-2 flex break-inside-avoid flex-col gap-2 rounded-lg border p-2",
        isBreak ? BREAK_ROW_CLASS : "border-neutral-800 bg-card",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="-ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted hover:text-white active:cursor-grabbing"
          aria-label={`Drag ${label} to reorder`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <p
          className={cn(
            "w-16 shrink-0 whitespace-nowrap text-sm font-semibold",
            isBreak && "text-primary",
          )}
        >
          {label}
        </p>
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
