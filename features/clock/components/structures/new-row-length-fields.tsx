"use client";

import CompactField from "@/features/clock/components/structures/compact-field";
import NumberInput from "@/features/clock/components/structures/number-input";
import { SECONDS_PER_MINUTE } from "@/features/clock/lib/levels";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import type { StructureDraft } from "@/features/clock/lib/structures";
import type React from "react";

// Editor-only lengths for new rows, entered in minutes.
const LENGTH_FIELDS: {
  field: "new_level_seconds" | "new_break_seconds";
  label: string;
}[] = [
  { field: "new_level_seconds", label: "New level length (min)" },
  { field: "new_break_seconds", label: "New break length (min)" },
];

// How long "Add level" and "Add break" make new rows. Template editor
// only; never saved.
function NewRowLengthFields({
  draft,
  dispatch,
}: {
  draft: StructureDraft;
  dispatch: React.Dispatch<StructureEditorAction>;
}) {
  return LENGTH_FIELDS.map(({ field, label }) => (
    <CompactField key={field} htmlFor={`structure-${field}`} label={label}>
      <NumberInput
        id={`structure-${field}`}
        min={1}
        step={1}
        value={draft[field] / SECONDS_PER_MINUTE}
        onValueChange={(minutes) =>
          dispatch({
            type: "setField",
            field,
            value: minutes * SECONDS_PER_MINUTE,
          })
        }
      />
    </CompactField>
  ));
}

export default NewRowLengthFields;
