import { CashSession, Member, Season, Week } from "@/utils/types";

interface ExtendedCashSession extends CashSession {
  member: Member;
  season: Season;
  week: Week;
}

const revertSessionEdits = ({
  session,
  originalSession,
  setEditingSessions,
  setBuyInInputs,
  setCashOutInputs,
}: {
  session: ExtendedCashSession;
  originalSession: ExtendedCashSession | null;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
  setBuyInInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCashOutInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}) => {
  if (!originalSession) return; // Safeguard

  setEditingSessions((prevSessions) =>
    prevSessions.map((s) =>
      s.id === originalSession.id
        ? {
            ...s,
            buy_in: originalSession.buy_in,
            cash_out: originalSession.cash_out,
            rebuys: originalSession.rebuys,
            net_profit: originalSession.net_profit,
          }
        : s
    )
  );

  setBuyInInputs((prev) => {
    const updated = { ...prev };
    delete updated[session.member_id];
    return updated;
  });

  setCashOutInputs((prev) => {
    const updated = { ...prev };
    delete updated[session.member_id];
    return updated;
  });
};

const editBuyInInput = ({
  e,
  session,
  setBuyInInputs,
  cashOutInputs,
  setEditingSessions,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
  session: ExtendedCashSession;
  cashOutInputs: Record<string, string>;
  setBuyInInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
}) => {
  let raw = e.target.value.replace(/^\$/, ""); // remove leading $
  setBuyInInputs((prev) => ({
    ...prev,
    [session.member_id]: raw,
  }));

  if (/^\d*\.?\d*$/.test(raw)) {
    const parsedBuyIn = parseFloat(raw);
    if (!isNaN(parsedBuyIn)) {
      const parsedCashOut = parseFloat(
        cashOutInputs[session.member_id] ??
          session?.cash_out.toFixed(2).toString()
      );

      const newNetProfit =
        !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
          ? parsedCashOut - parsedBuyIn
          : 0;

      setEditingSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.member_id === session.member_id
            ? {
                ...s,
                buy_in: parsedBuyIn,
                net_profit: newNetProfit,
              }
            : s
        )
      );
    }
  }
};

const editCashOutInput = ({
  e,
  session,
  setCashOutInputs,
  buyInInputs,
  setEditingSessions,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
  session: ExtendedCashSession;
  buyInInputs: Record<string, string>;
  setCashOutInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
}) => {
  let raw = e.target.value.replace(/^\$/, ""); // remove leading $
  setCashOutInputs((prev) => ({
    ...prev,
    [session.member_id]: raw,
  }));

  if (/^\d*\.?\d*$/.test(raw)) {
    const parsedCashOut = parseFloat(raw);
    if (!isNaN(parsedCashOut)) {
      const parsedBuyIn = parseFloat(
        buyInInputs[session.member_id] ?? session?.buy_in.toFixed(2).toString()
      );

      const newNetProfit =
        !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
          ? parsedCashOut - parsedBuyIn
          : 0;

      setEditingSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.member_id === session.member_id
            ? {
                ...s,
                cash_out: parsedCashOut,
                net_profit: newNetProfit,
              }
            : s
        )
      );
    }
  }
};

const keepRemovedSession = ({
  session,
  originalSession,
  setSessionsToRemove,
  setEditingSessions,
  setCashOutInputs,
  setBuyInInputs,
}: {
  session: ExtendedCashSession;
  originalSession: ExtendedCashSession | undefined;
  setSessionsToRemove: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
  setBuyInInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCashOutInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}) => {
  setSessionsToRemove((prev) => prev.filter((s) => s.id !== session.id));

  if (!originalSession) return;

  setEditingSessions((prevSessions) =>
    prevSessions.map((s) =>
      s.id === session.id
        ? {
            ...s,
            buy_in: originalSession.buy_in,
            cash_out: originalSession.cash_out,
            rebuys: originalSession.rebuys,
            net_profit: originalSession.net_profit,
            poy_points: originalSession.poy_points,
            nlpi_points: originalSession.nlpi_points,
          }
        : s
    )
  );
  setCashOutInputs((prev) => {
    const updated = { ...prev };
    delete updated[session.member_id];
    return updated;
  });

  setBuyInInputs((prev) => {
    const updated = { ...prev };
    delete updated[session.member_id];
    return updated;
  });
};

export {
  revertSessionEdits,
  editBuyInInput,
  editCashOutInput,
  keepRemovedSession,
};
