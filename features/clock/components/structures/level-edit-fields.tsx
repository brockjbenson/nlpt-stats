"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompactField from "@/features/clock/components/structures/compact-field";
import NumberInput from "@/features/clock/components/structures/number-input";
import {
  NOTE_MAX_LENGTH,
  SECONDS_PER_MINUTE,
} from "@/features/clock/lib/levels";
import type { BlindLevel } from "@/features/clock/types";

type BlindField = "small_blind" | "big_blind" | "ante";

const BLIND_FIELDS: { field: BlindField; label: string }[] = [
  { field: "small_blind", label: "SB" },
  { field: "big_blind", label: "BB" },
  { field: "ante", label: "Ante" },
];

type Props = {
  level: BlindLevel;
  // The element id for one of this row's fields.
  id: (field: string) => string;
  update: (change: Partial<BlindLevel>) => void;
};

// The fields for one timeline stop: type, blinds and ante (levels), length,
// and a note (breaks).
function LevelEditFields({ level, id, update }: Props) {
  const isBreak = level.kind === "break";
  return (
    <div
      id={id("fields")}
      className="grid grid-cols-2 gap-2 px-1 pb-1 pt-2 sm:grid-cols-5"
    >
      <CompactField htmlFor={id("kind")} label="Type">
        <Select
          value={level.kind}
          onValueChange={(kind) => update({ kind: kind as BlindLevel["kind"] })}
        >
          <SelectTrigger id={id("kind")} variant="outline" className="h-9 px-2">
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
  );
}

export default LevelEditFields;
