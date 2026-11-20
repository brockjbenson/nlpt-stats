"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type {
  SettingsAction,
  SettingsNumberField,
} from "@/features/clock/lib/structure-editor";
import {
  NAME_MAX_LENGTH,
  type SettingsFields as Settings,
  type StructureError,
  type StructureField,
} from "@/features/clock/lib/structures";
import type React from "react";

const NUMBER_FIELDS: {
  field: SettingsNumberField;
  label: string;
  step: number;
}[] = [
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
  // Prefix for the inputs' ids ("structure", "clock").
  idPrefix: string;
  settings: Settings;
  errors: StructureError[];
  dispatch: React.Dispatch<SettingsAction>;
  namePlaceholder?: string;
  // More fields after the shared ones, in the same grid.
  children?: React.ReactNode;
};

// Name, money, chips and rebuy limit: the settings a template and a new
// clock share.
function SettingsFields({
  idPrefix,
  settings,
  errors,
  dispatch,
  namePlaceholder,
  children,
}: Props) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4">
          <CompactField
            htmlFor={`${idPrefix}-name`}
            label="Name"
            className="col-span-2"
          >
            <Input
              id={`${idPrefix}-name`}
              className="h-9 px-2 text-sm"
              value={settings.name}
              maxLength={NAME_MAX_LENGTH}
              placeholder={namePlaceholder}
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
              htmlFor={`${idPrefix}-${field}`}
              label={label}
            >
              <NumberInput
                id={`${idPrefix}-${field}`}
                min={0}
                step={step}
                value={settings[field]}
                onValueChange={(value) =>
                  dispatch({ type: "setField", field, value })
                }
              />
            </CompactField>
          ))}
          {children}
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
