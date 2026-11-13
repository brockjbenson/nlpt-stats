"use client";

import { CashSession } from "@/utils/types";
import React, { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import SessionBalanceTracker, {
  CASH_BALANCE_SLOT_ID,
} from "./session-balance-tracker";

const subscribeNoop = () => () => {};
const getSlot = () => document.getElementById(CASH_BALANCE_SLOT_ID);
const getServerSlot = () => null;

// Shows buy-ins, cash-outs and the difference in the bottom row of the
// mobile page header (like the stats page tabs). The header is
// server-rendered, so this portals into the row the page left for it. On
// desktop (no mobile header) it shows above the session list instead.
export default function HeaderBalance({
  sessions,
}: {
  sessions: Omit<CashSession, "id">[];
}) {
  const slot = useSyncExternalStore(subscribeNoop, getSlot, getServerSlot);

  return (
    <>
      {slot &&
        createPortal(<SessionBalanceTracker sessions={sessions} />, slot)}
      <SessionBalanceTracker
        sessions={sessions}
        className="mb-4 hidden text-sm md:grid"
      />
    </>
  );
}
