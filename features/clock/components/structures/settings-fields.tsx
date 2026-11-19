"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import {
  NAME_MAX_LENGTH,
  type StructureDraft,
  type StructureError,
  type StructureField,
} from "@/features/clock/lib/structures";
import type React from "react";

type NumberField =
  | "buy_in"
  | "rebuy"
  | "starting_chips"
  | "rebuy_chips"
  | "max_rebuys";

const NUMBER_FIELDS: { field: NumberField; label: string; step: number }[] = [
  { field: "buy_in", label: "Buy-in ($)", step: 1 },
  { field: "rebuy", label: "Rebuy ($)", step: 1 },
  { field: "starting_chips", label: "Starting chips", step: 1000 },
  { field: "rebuy_chips", label: "Rebuy chips", step: 1000 },
  { field: "max_rebuys", label: "Max rebuys", step: 1 },
];

// The error sections shown under these fields.
const SETTINGS_ERROR_FIELDS: StructureField[] = [
  "name",
  "money",
  "chips",
  "max_rebuys",
];

type Props = {
  draft: StructureDraft;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

function SettingsFields({ draft, errors, dispatch }: Props) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4">
          <CompactField
            htmlFor="structure-name"
            label="Name"
            className="col-span-2"
          >
            <Input
              id="structure-name"
              className="h-9 px-2 text-sm"
              value={draft.name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="NLPT Standard"
              onChange={(event) =>
                dispatch({
                  type: "setField",
                  field: "name",
                  value: event.target.value,
                })
              }
            />
          </CompactField>
          {NUMBER_FIELDS.map(({ field, label, step }) => (
            <CompactField
              key={field}
              htmlFor={`structure-${field}`}
              label={label}
            >
              <NumberInput
                id={`structure-${field}`}
                min={0}
                step={step}
                value={draft[field]}
                onValueChange={(value) =>
                  dispatch({ type: "setField", field, value })
                }
              />
            </CompactField>
          ))}
        </div>
        <ErrorText
          errors={errors.filter(({ field }) =>
            SETTINGS_ERROR_FIELDS.includes(field),
          )}
        />
      </CardContent>
    </Card>
  );
}

export default SettingsFields;
