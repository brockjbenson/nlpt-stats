import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

// One tab in the floating bar: icon above a small label. `highlighted` is the
// tab under the selection pill (or under the lens while dragging); `current`
// is the page you're on, for screen readers.
function BottomTab({
  href,
  label,
  icon,
  highlighted,
  current,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  highlighted: boolean;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      draggable={false}
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] leading-none font-semibold transition-colors duration-200 [-webkit-touch-callout:none]",
        highlighted ? "text-primary" : "text-neutral-300",
      )}>
      <span className="flex size-6 items-center justify-center">{icon}</span>
      {label}
    </Link>
  );
}

export default BottomTab;
