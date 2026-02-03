import { cn } from "@/lib/utils";
import React from "react";

interface StatColumnProps {
  formatter?: (value: number) => string;
  colorFormatter?: (value: number) => string;
  children?: React.ReactNode;
}

function StatColumn({ formatter, colorFormatter, children }: StatColumnProps) {
  return (
    <div
      className={cn(
        colorFormatter && colorFormatter(children as number),
        "w-full flex items-center py-1 justify-center",
      )}>
      {formatter ? formatter(children as number) : children}
    </div>
  );
}

export default StatColumn;
