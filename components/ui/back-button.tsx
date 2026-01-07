"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const BackButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const router = useRouter();
    return (
      <Comp
        onClick={() => router.back()}
        className={cn(
          "size-8 ml-1 rounded-full border border-border flex items-center justify-center",
          className
        )}
        ref={ref}
        {...props}>
        <ChevronLeft className="w-4 h-4" />
      </Comp>
    );
  }
);
BackButton.displayName = "BackButton";

export { BackButton };
