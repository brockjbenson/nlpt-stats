import { cn } from "@/lib/utils";
import { CashSession } from "@/utils/types";
import { formatMoney } from "@/utils/utils";
import React from "react";

// Element id of the header's bottom row on the New Cash Session page that
// the totals are rendered into (see header-balance.tsx).
export const CASH_BALANCE_SLOT_ID = "cash-session-balance";

interface Props {
  sessions: Omit<CashSession, "id">[];
  className?: string;
}

// Work in cents so float sums like 0.1 + 0.2 don't show as "off by $0.00"
function toCents(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

// The night's buy-ins, cash-outs, and the difference between them: "Balanced"
// in green, or the difference (cash-outs minus buy-ins) in red.
function SessionBalanceTracker({ sessions, className }: Props) {
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
    <div
      className={cn(
        "grid w-full grid-cols-3 text-center text-xs leading-snug",
        className,
      )}
    >
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
