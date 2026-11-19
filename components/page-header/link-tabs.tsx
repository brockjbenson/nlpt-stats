import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export type LinkTab = {
  href: string;
  label: string;
  active: boolean;
};

const VARIANTS = {
  // Underlined tabs for the mobile header. The tab's underline sits on the
  // container's bottom border: -bottom-px moves the 1px line down onto it.
  underline: {
    list: "",
    tab: "relative block px-2 pt-1 pb-2 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-transparent",
    active: "text-primary after:bg-primary",
  },
  // Pill-shaped chips for desktop; the active one is filled.
  chips: {
    list: "flex-wrap gap-2",
    tab: "block rounded-full border border-neutral-700 px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground",
    active:
      "border-primary bg-primary text-white hover:bg-primary hover:text-white",
  },
} as const;

export type LinkTabsVariant = keyof typeof VARIANTS;

// A row of links styled as tabs or chips, the active one highlighted. No
// server imports, so loading states (client components) can use it too.
function LinkTabs({
  tabs,
  variant = "underline",
  className,
}: {
  tabs: LinkTab[];
  variant?: LinkTabsVariant;
  className?: string;
}) {
  const styles = VARIANTS[variant];
  return (
    <ul
      className={cn(
        "w-full flex items-center justify-start",
        styles.list,
        className,
      )}
    >
      {tabs.map((tab) => (
        <li key={tab.href}>
          <Link
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(styles.tab, tab.active && styles.active)}
          >
            {tab.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default LinkTabs;
