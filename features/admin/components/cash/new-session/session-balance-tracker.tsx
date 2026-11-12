import { cn } from "@/lib/utils";
import { CashSession } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import React from "react";

interface Props {
  sessions: Omit<CashSession, "id">[];
}

// Work in cents so float sums like 0.1 + 0.2 don't show as "off by $0.00"
function toCents(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

function SessionBalanceTracker({ sessions }: Props) {
  const buyInCents = sessions.reduce((sum, s) => sum + toCents(s.buy_in), 0);
  const cashOutCents = sessions.reduce(
    (sum, s) => sum + toCents(s.cash_out),
    0,
  );
  const diffCents = cashOutCents - buyInCents;
  const isBalanced = diffCents === 0;

  const diffLabel = isBalanced
    ? "Balanced"
    : `${diffCents > 0 ? "+" : "-"}$${formatMoney(Math.abs(diffCents) / 100)}`;

  return (
    <div className="grid grid-cols-3 w-full max-w-(--breakpoint-lg) mb-3 text-center text-xs md:text-sm">
      <div className="flex flex-col">
        <span className="text-muted">Buy Ins</span>
        <span className="font-medium">${formatMoney(buyInCents / 100)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-muted">Cash Outs</span>
        <span className="font-medium">${formatMoney(cashOutCents / 100)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-muted">Difference</span>
        <span
          className={cn(
            "font-semibold",
            isBalanced ? "text-green-600" : "text-red-600",
          )}
        >
          {diffLabel}
        </span>
      </div>
    </div>
  );
}

export default SessionBalanceTracker;
