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
      }}
      className="flex flex-col mx-auto pb-8 w-full lg:px-4 items-center">
      {children}
    </div>
  );
}

export default MainWrapper;
