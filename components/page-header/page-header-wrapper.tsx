"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useScrollState } from "@/app/providers/scroll-context";

function PageHeaderWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const headerRef = useRef<HTMLDivElement>(null);

  const { headerTranslateY } = useScrollState();

  return (
    <div
      ref={headerRef}
      id="page-header-wrapper"
      className={cn(
        "w-full border-b bg-background z-20 sticky md:relative top-0 border-neutral-700 mb-4 px-2 pb-4 flex md:hidden items-center justify-between",
        className
      )}
      style={{
        willChange: "transform",
        transform: `translateY(${headerTranslateY}px)`,
      }}>
      {children}
    </div>
  );
}

export default PageHeaderWrapper;
