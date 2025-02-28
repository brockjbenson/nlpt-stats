"use client";

import usePullToRefresh from "@/hooks/use-pull-to-refresh";
import { useRouterRefresh } from "@/hooks/use-router-refresh";
import { cn } from "@/lib/utils";
import { ArrowDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function MainWrapper({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const refresh = useRouterRefresh();
  const handleRefresh = async () => {
    await refresh();
  };

  const state = usePullToRefresh(ref, handleRefresh);

  const { isRefreshing, showIndicator, flipIndicator } = state;

  return (
    <>
      <div
        id="refresh-wrapper"
        className={cn(
          "fixed left-0 pointer-events-none w-full z-10 overflow-hidden flex items-center justify-center transition-all duration-200",
          showIndicator
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full"
        )}>
        {isRefreshing ? (
          <Loader2 className="animate-spin w-6 h-6 text-muted" />
        ) : (
          <ArrowDown
            className={cn(
              "w-6 h-6 text-muted transition-transform duration-200",
              flipIndicator ? " !rotate-180" : "!rotate-0"
            )}
          />
        )}
      </div>
      <div
        ref={ref}
        id="main-wrapper"
        className="flex flex-col mx-auto pb-8 w-full lg:px-4 items-center">
        {children}
      </div>
    </>
  );
}

export default MainWrapper;
