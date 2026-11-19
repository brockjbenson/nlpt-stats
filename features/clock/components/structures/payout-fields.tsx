"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import { ordinal } from "@/features/clock/lib/format";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import type {
  StructureDraft,
  StructureError,
} from "@/features/clock/lib/structures";
import { cn } from "@/lib/utils";
import type React from "react";

const PERCENT_TOTAL = 100;
// Matches the validation tolerance for hand-typed decimals.
const PERCENT_TOLERANCE = 0.000001;

type Props = {
  draft: StructureDraft;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

function PayoutFields({ draft, errors, dispatch }: Props) {
  const total = draft.payout_pcts.reduce(
    (sum, pct) => sum + (Number.isNaN(pct) ? 0 : pct),
    0,
  );
  const isComplete = Math.abs(total - PERCENT_TOTAL) <= PERCENT_TOLERANCE;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payouts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field className="max-w-40">
          <FieldLabel htmlFor="structure-places-paid">Places paid</FieldLabel>
          <NumberInput
            id="structure-places-paid"
            min={3}
            step={1}
            value={draft.places_paid}
            onValueChange={(value) =>
              dispatch({ type: "setPlacesPaid", value })
            }
          />
        </Field>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {draft.payout_pcts.map((pct, index) => (
            <Field key={index}>
              <FieldLabel htmlFor={`structure-payout-${index}`}>
                {ordinal(index + 1)} (%)
              </FieldLabel>
              <NumberInput
                id={`structure-payout-${index}`}
                min={0}
                max={100}
                step={1}
                value={pct}
                onValueChange={(value) =>
                  dispatch({ type: "setPayoutPct", index, value })
                }
              />
            </Field>
          ))}
        </div>
        <p
          className={cn(
            "text-sm font-semibold",
            isComplete ? "text-muted" : "text-destructive",
          )}
        >
          Total: {Number(total.toFixed(6))}%
        </p>
        <ErrorText
          errors={errors.filter(
            ({ field }) => field === "places_paid" || field === "payout_pcts",
          )}
        />
      </CardContent>
    </Card>
  );
}

export default PayoutFields;
