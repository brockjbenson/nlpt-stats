"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type React from "react";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number | null;
  // An empty box is NaN, so validation can say what's missing.
  onValueChange: (value: number) => void;
};

// A compact number box that can be emptied while typing (a plain
// Number("") is 0).
function NumberInput({ value, onValueChange, className, ...props }: Props) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      className={cn("h-9 px-2 text-sm", className)}
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
