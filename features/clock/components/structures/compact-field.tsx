import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type React from "react";

// A small label over its input, for the dense editor layout.
function CompactField({
  htmlFor,
  label,
  className,
  children,
}: {
  htmlFor: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field className={cn("gap-1", className)}>
      <FieldLabel htmlFor={htmlFor} className="text-xs text-muted">
        {label}
      </FieldLabel>
      {children}
    </Field>
  );
}

export default CompactField;
