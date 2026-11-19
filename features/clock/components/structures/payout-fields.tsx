"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import { ordinal } from "@/features/clock/lib/format";
import type { StructureEditorAction } from "@/features/clock/lib/structure-editor";
import {
  isCompleteSplit,
  payoutTotal,
  type StructureDraft,
  type StructureError,
} from "@/features/clock/lib/structures";
import { cn } from "@/lib/utils";
import type React from "react";

type Props = {
  draft: StructureDraft;
  errors: StructureError[];
  dispatch: React.Dispatch<StructureEditorAction>;
};

function PayoutFields({ draft, errors, dispatch }: Props) {
  const total = payoutTotal(draft.payout_pcts);
  const isComplete = isCompleteSplit(draft.payout_pcts);
  const hasLastPlace =
    Number.isInteger(draft.places_paid) && draft.places_paid >= 2;

  return (
    <Card className="gap-2">
      <CardHeader className="justify-between gap-2">
        <CardTitle className="text-base">Payouts</CardTitle>
        <p
          className={cn(
            "text-xs font-semibold",
            isComplete ? "text-muted" : "text-destructive",
          )}
        >
          Total {Number(total.toFixed(6))}%
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <CompactField
            htmlFor="structure-places-paid"
            label="Places paid"
            className="w-24"
          >
            <NumberInput
              id="structure-places-paid"
              min={3}
              step={1}
              value={draft.places_paid}
              onValueChange={(value) =>
                dispatch({ type: "setPlacesPaid", value })
              }
            />
          </CompactField>
          {draft.payout_pcts.map((pct, index) => (
            <CompactField
              key={index}
              htmlFor={`structure-payout-${index}`}
              label={`${ordinal(index + 1)} %`}
              className="w-20"
            >
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
            </CompactField>
          ))}
        </div>
        {hasLastPlace && (
          <p className="text-xs text-muted">
            {ordinal(draft.places_paid)} gets 1 ÷ players of the pool, rounded
            up to a whole percent (11 players → 10%): at least the buy-in back.
            The places above split the rest.
          </p>
        )}
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
