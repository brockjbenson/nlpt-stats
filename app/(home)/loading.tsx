import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import React from "react";

function loading() {
  return (
    <div className="animate-pulse">
      <PageHeader skeleton />
      <div className="flex items-center justify-between pt-8 px-2">
        <div className="h-[28px] w-32 bg-neutral-700 rounded"></div>
        <div className="h-[28px] w-16 bg-neutral-700 rounded"></div>
      </div>
      <Card className="p-2 mt-4 mx-auto w-[calc(100%-1rem)]">
        <div className="h-[28px] mt-2 ml-2 mb-8 w-24 bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
        <div className="h-[40px] mb-4 w-full bg-neutral-700 rounded"></div>
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

export default loading;
