"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import type {
  DraftLevel,
  StructureError,
} from "@/features/clock/lib/structures";
import type { BlindLevel } from "@/features/clock/types";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type React from "react";

const SECONDS_PER_MINUTE = 60;

type BlindField = "small_blind" | "big_blind" | "ante";

const BLIND_FIELDS: { field: BlindField; label: string }[] = [
  { field: "small_blind", label: "Small blind" },
  { field: "big_blind", label: "Big blind" },
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

  return (
    <li className="flex flex-col gap-3 border-b border-neutral-800 py-4 last:border-b-0">
      <div className="flex items-center gap-2">
        <p className="min-w-20 font-semibold">{label}</p>
        <Select
          value={level.kind}
          onValueChange={(kind) => update({ kind: kind as BlindLevel["kind"] })}
        >
          <SelectTrigger
            variant="outline"
            className="h-9 w-28"
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
            disabled={isFirst}
            aria-label={`Move ${label} up`}
            onClick={() =>
              dispatch({ type: "moveLevel", index, direction: "up" })
            }
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={isLast}
            aria-label={`Move ${label} down`}
            onClick={() =>
              dispatch({ type: "moveLevel", index, direction: "down" })
            }
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!canRemove}
            aria-label={`Remove ${label}`}
            onClick={() => dispatch({ type: "removeLevel", index })}
          >
            <Trash2 className="text-red-600" size={16} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {level.kind === "level" &&
          BLIND_FIELDS.map(({ field, label: fieldLabel }) => (
            <Field key={field}>
              <FieldLabel htmlFor={id(field)}>{fieldLabel}</FieldLabel>
              <NumberInput
                id={id(field)}
                min={0}
                step={25}
                value={level[field]}
                onValueChange={(value) => update({ [field]: value })}
              />
            </Field>
          ))}
        <Field>
          <FieldLabel htmlFor={id("minutes")}>Minutes</FieldLabel>
          <NumberInput
            id={id("minutes")}
            min={1}
            step={1}
            value={level.duration_seconds / SECONDS_PER_MINUTE}
            onValueChange={(minutes) =>
              update({ duration_seconds: minutes * SECONDS_PER_MINUTE })
            }
          />
        </Field>
      </div>
      <ErrorText errors={errors} />
    </li>
  );
}

export default LevelRow;
