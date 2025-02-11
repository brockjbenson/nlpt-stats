import PageHeader from "@/components/page-header/page-header";
import React from "react";

function Loading() {
  return (
    <div className="animate-pulse mt-4 w-full max-w-screen-xl mx-auto px-2">
      <PageHeader skeleton title="Members" />
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="border-b border-neutral-500 grid gap-4 md:gap-8 py-4 md:py-8 w-full grid-cols-[80px_1fr]">
          <div className="w-full aspect-square h-auto bg-neutral-700 rounded-full"></div>
          <ul className="flex flex-col w-full justify-center gap-2">
            <li className="bg-neutral-700 w-40 rounded h-[18px]"></li>
            <li className="bg-neutral-700 w-40 rounded h-[18px]"></li>
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Loading;
