import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check } from "lucide-react";

const YearSelector = ({ ...props }) => {
  return <DropdownMenu {...props} />;
};

const YearSelectorTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof DropdownMenuTrigger>
>(({ ...props }, ref) => {
  return (
    <DropdownMenuTrigger ref={ref} className={cn(props.className)} {...props} />
  );
});
YearSelectorTrigger.displayName = "YearSelectorTrigger";

const YearSelectorContent = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) => {
  return (
    <DropdownMenuContent
      className={cn("w-full mt-2 min-w-50", className)}
      {...props}
    />
  );
};
YearSelectorContent.displayName = "YearSelectorContent";

interface YearSelectorItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  href: string;
  active?: boolean;
}
const YearSelectorItem = React.forwardRef<
  HTMLAnchorElement,
  YearSelectorItemProps
>(({ active, className, href, ...props }, ref) => {
  return (
    <DropdownMenuItem asChild>
      <Link
        className={cn(
          "w-full rounded p-3 text-base!",
          active && "bg-card",
          className
        )}
        ref={ref}
        href={href}
        {...props}>
        {props.children}
        {active && <Check className="ml-auto text-foreground" size={16} />}
      </Link>
    </DropdownMenuItem>
  );
});
YearSelectorItem.displayName = "YearSelectorItem";

export {
  YearSelector,
  YearSelectorTrigger,
  YearSelectorContent,
  YearSelectorItem,
};
