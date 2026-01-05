import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

const BottomTab = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { href: string; active: string }
>(({ className, children, onClick, active, id, href, ...props }, ref) => (
  <Link
    id={id}
    ref={ref}
    href={href}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-between gap-1 h-12 text-xs",
      active === id
        ? "text-primary font-semibold"
        : "text-neutral-600 font-medium",
      className
    )}
    {...props}>
    {children}
  </Link>
));
BottomTab.displayName = "BottomTab";
export default BottomTab;
