"use client";

import { Input } from "@/components/ui/input";
import type React from "react";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number | null;
  // An empty box is NaN, so validation can say what's missing.
  onValueChange: (value: number) => void;
};

// A number box that can be emptied while typing (a plain Number("") is 0).
function NumberInput({ value, onValueChange, ...props }: Props) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={value === null || Number.isNaN(value) ? "" : value}
      onChange={(event) =>
        onValueChange(
          event.target.value === "" ? Number.NaN : Number(event.target.value),
        )
      }
      {...props}
    />
  );
}

export default NumberInput;
