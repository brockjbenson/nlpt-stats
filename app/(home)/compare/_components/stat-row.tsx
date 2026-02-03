import React from "react";

function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid relative h-8.25 grid-cols-3 w-full gap-4 border-b border-input last:border-b-0">
      {children}
    </div>
  );
}

export default StatRow;
