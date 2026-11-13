"use client";

import { useScrollState } from "@/app/providers/scroll-context";
import React from "react";

function MainWrapper({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { headerHeight } = useScrollState();
  return (
    <div
      ref={ref}
      id="main-wrapper"
      style={{
        paddingTop: `${headerHeight + 16}px`,
        // Clear the floating tab bar so the last content can scroll above it
        paddingBottom: "calc(var(--nav-height, 0px) + 1rem)",
      }}
      className="flex flex-col mx-auto pb-8 w-full lg:px-4 items-center"
    >
      {children}
    </div>
  );
}

export default MainWrapper;
