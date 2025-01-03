import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "default";
  type?: "default" | "primary" | "secondary";
}

const styles = cva("rounded border p-4", {
  variants: {
    sizes: {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "w-full",
      default: "w-full",
    },
    types: {
      default: "bg-primary/15 border-primary/75 ",
      primary: "bg-primary/15 border-primary/75 ",
      secondary: "bg-secondary",
    },
  },
});

function Card({
  className,
  title,
  type = "default",
  children,
  size = "default",
}: Props) {
  return (
    <div className={cn(styles({ sizes: size, types: type }), className)}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export default Card;
