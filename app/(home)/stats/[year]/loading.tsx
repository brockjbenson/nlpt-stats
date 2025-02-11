import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

function StatsLoading() {
  return (
    <div className="animate-pulse">
      <PageHeader skeleton title="Stats" />
      <nav className="md:hidden h-[57px] items-center border-b border-neutral-500 mb-4 flex w-full">
        <ul className="grid gap-4 grid-cols-4 h-[60%] px-4 w-full">
          <li className="w-full rounded bg-neutral-700 h-full"></li>
          <li className="w-full rounded bg-neutral-700 h-full"></li>
          <li className="w-full rounded bg-neutral-700 h-full"></li>
          <li className="w-full rounded bg-neutral-700 h-full"></li>
        </ul>
      </nav>
      <div className="grid w-full px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <Card className={cn("p-2", i > 0 && "hidden md:block")}>
            <div className="h-[28px] mt-2 ml-2 mb-8 w-24 bg-neutral-700 rounded"></div>
            <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
            <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
            <div className="h-[40px] w-full bg-neutral-700 rounded"></div>
          </Card>
        ))}
      </div>
      <Card className="p-2 mx-auto w-[calc(100%-1rem)]">
        <div className="h-[28px] mt-2 ml-2 mb-8 w-24 bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
      </Card>
    </div>
  );
}

export default StatsLoading;
