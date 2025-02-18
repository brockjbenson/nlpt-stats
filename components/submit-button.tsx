"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  pendingIcon?: React.ReactNode;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  pendingIcon,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? (pendingIcon ? pendingIcon : pendingText) : children}
    </Button>
  );
}
