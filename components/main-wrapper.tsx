"use client";

import React from "react";

function MainWrapper({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      id="main-wrapper"
      className="flex flex-col mx-auto pb-8 w-full lg:px-4 items-center">
      {children}
    </div>
  );
}

export default MainWrapper;
