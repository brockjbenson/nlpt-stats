"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import { formatChips, formatElapsed } from "@/features/clock/lib/format";
import { NOTE_MAX_LENGTH } from "@/features/clock/lib/levels";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import type {
  DraftLevel,
  StructureError,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Coffee, GripVertical, Trash2 } from "lucide-react";
import type React from "react";

const SECONDS_PER_MINUTE = 60;
// Break stops: a solid primary tint over the card, so a dragged break still
// covers the stops it passes over.
const BREAK_CARD_CLASS =
  "border-primary/50 bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]";

type BlindField = "small_blind" | "big_blind" | "ante";

const BLIND_FIELDS: { field: BlindField; label: string }[] = [
  { field: "small_blind", label: "SB" },
  { field: "big_blind", label: "BB" },
  { field: "ante", label: "Ante" },
];

function chips(value: number | null): string {
  return value !== null && Number.isFinite(value) ? formatChips(value) : "—";
}

// "1,000 / 2,000", plus " · ante 200" when there is one.
function blindsText(level: BlindLevel): string {
  const blinds = `${chips(level.small_blind)} / ${chips(level.big_blind)}`;
  return level.ante > 0 ? `${blinds} · ante ${chips(level.ante)}` : blinds;
}

function minutesText(level: BlindLevel): string {
  const minutes = level.duration_seconds / SECONDS_PER_MINUTE;
  return Number.isFinite(minutes) ? `${minutes}m` : "—";
}

// The dot and line on the left of a stop. The line runs from the previous
// stop to the next, so it starts at the first dot and ends at the last.
function TimelineMarker({
  isBreak,
  isFirst,
  isLast,
}: {
  isBreak: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="relative w-4 shrink-0" aria-hidden>
      <span
        className={cn(
          "absolute left-1/2 w-px -translate-x-1/2 bg-neutral-700",
          isFirst ? "top-4" : "top-0",
          isLast ? "h-4" : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute left-1/2 top-[11px] -translate-x-1/2",
          isBreak
            ? "size-3 rotate-45 bg-primary"
            : "size-2.5 rounded-full border-2 border-primary bg-background",
        )}
      />
    </div>
  );
}

type Props = {
  level: DraftLevel;
  index: number;
  // "Level 5" or "Break".
  label: string;
  // When this stop starts, from the start of the tournament.
  startMs: number;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  canRemove: boolean;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

// One stop on the levels timeline: its start time, a summary line, and (when
// tapped) the fields to edit it.
function LevelRow({
  level,
  index,
  label,
  startMs,
  isFirst,
  isLast,
  isExpanded,
  onToggle,
  canRemove,
  errors,
  dispatch,
}: Props) {
  const update = (change: Partial<BlindLevel>): void =>
    dispatch({ type: "updateLevel", index, change });
  const id = (field: string): string => `level-${level.key}-${field}`;
  const isBreak = level.kind === "break";
  const hasErrors = errors.length > 0;
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
      className={cn("flex gap-2", isDragging && "relative z-10")}
    >
      <p className="w-10 shrink-0 pt-2 text-right text-xs tabular-nums text-muted">
        {formatElapsed(startMs)}
      </p>
      <TimelineMarker isBreak={isBreak} isFirst={isFirst} isLast={isLast} />
      <div className="min-w-0 flex-1 pb-2">
        <div
          className={cn(
            "rounded-lg border px-1 py-1",
            isBreak ? BREAK_CARD_CLASS : "border-neutral-800 bg-card",
            hasErrors && "border-destructive",
            isDragging && "shadow-lg ring-2 ring-primary",
          )}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              ref={setActivatorNodeRef}
              className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted hover:text-white active:cursor-grabbing"
              aria-label={`Drag ${label} to reorder`}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-controls={id("fields")}
              className="flex min-w-0 flex-1 items-center gap-3 rounded py-1 text-left text-sm"
            >
              <span
                className={cn(
                  "w-16 shrink-0 whitespace-nowrap font-semibold",
                  isBreak && "text-primary",
                )}
              >
                {isBreak ? (
                  <span className="inline-flex items-center gap-1">
                    <Coffee size={14} /> Break
                  </span>
                ) : (
                  label
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  isBreak ? "italic text-muted" : "tabular-nums",
                )}
              >
                {isBreak ? (level.note ?? "") : blindsText(level)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {minutesText(level)}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 text-muted transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              disabled={!canRemove}
              aria-label={`Remove ${label}`}
              onClick={() => dispatch({ type: "removeLevel", index })}
            >
              <Trash2 className="text-red-600" size={14} />
            </Button>
          </div>
          {isExpanded && (
            <div
              id={id("fields")}
              className="grid grid-cols-2 gap-2 px-1 pb-1 pt-2 sm:grid-cols-5"
            >
              <CompactField htmlFor={id("kind")} label="Type">
                <Select
                  value={level.kind}
                  onValueChange={(kind) =>
                    update({ kind: kind as BlindLevel["kind"] })
                  }
                >
                  <SelectTrigger
                    id={id("kind")}
                    variant="outline"
                    className="h-9 px-2"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level">Level</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                  </SelectContent>
                </Select>
              </CompactField>
              {!isBreak &&
                BLIND_FIELDS.map(({ field, label: fieldLabel }) => (
                  <CompactField
                    key={field}
                    htmlFor={id(field)}
                    label={fieldLabel}
                  >
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
              {isBreak && (
                <CompactField
                  htmlFor={id("note")}
                  label="Note (optional)"
                  className="col-span-2 sm:col-span-3"
                >
                  <Input
                    id={id("note")}
                    className="h-9 px-2 text-sm"
                    maxLength={NOTE_MAX_LENGTH}
                    placeholder="Color up the 25s"
                    value={level.note ?? ""}
                    onChange={(event) => update({ note: event.target.value })}
                  />
                </CompactField>
              )}
            </div>
          )}
          <div className="px-1">
            <ErrorText errors={errors} />
          </div>
        </div>
      </div>
    </li>
  );
}

export default LevelRow;
