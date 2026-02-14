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

const HeaderSelector = ({ ...props }) => {
  return <DropdownMenu {...props} />;
};

const HeaderSelectorTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof DropdownMenuTrigger>
>(({ ...props }, ref) => {
  return (
    <DropdownMenuTrigger
      ref={ref}
      className={cn(
        "font-bold flex items-center justify-center gap-2 text-xl",
        props.className,
      )}
      {...props}
    />
  );
});
HeaderSelectorTrigger.displayName = "HeaderSelectorTrigger";

const HeaderSelectorContent = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) => {
  return (
    <DropdownMenuContent
      className={cn("w-full h-fit mt-2 min-w-50", className)}
      {...props}
    />
  );
};
HeaderSelectorContent.displayName = "HeaderSelectorContent";

interface HeaderSelectorItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  href: string;
  active?: boolean;
}
const HeaderSelectorItem = React.forwardRef<
  HTMLAnchorElement,
  HeaderSelectorItemProps
>(({ active, className, href, ...props }, ref) => {
  return (
    <DropdownMenuItem asChild>
      <Link
        className={cn(
          "w-full rounded p-3 text-base!",
          active && "bg-card",
          className,
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
HeaderSelectorItem.displayName = "HeaderSelectorItem";

export {
  HeaderSelector,
  HeaderSelectorTrigger,
  HeaderSelectorContent,
  HeaderSelectorItem,
};
