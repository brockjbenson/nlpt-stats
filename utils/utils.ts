import { redirect } from "next/navigation";
import { CashSessionWithFullMember, CashSessionWithMember } from "./types";

const POYPointsMap: Record<number, number> = {
  1: 50,
  2: 40,
  3: 30,
  4: 25,
  5: 20,
  6: 15,
  7: 12.5,
  8: 10,
  9: 7.5,
  10: 5,
  11: 2.5,
  12: 1,
  13: 1,
  14: 1,
};
/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function getProfitTextColor(profit: number) {
  return profit > 0
    ? "text-green-500"
    : profit < 0
      ? "text-red-500"
      : "text-foreground";
}

export function formatMoney(amount: number) {
  return amount >= 0 ? `$${amount.toFixed(2)}` : `$${(amount * -1).toFixed(2)}`;
}

export function getBottomThree(sessions: CashSessionWithMember[]) {
  return sessions.sort((a, b) => a.netProfit - b.netProfit).slice(0, 3);
}

export function getTopThree(sessions: CashSessionWithMember[]) {
  return sessions.sort((a, b) => b.netProfit - a.netProfit).slice(0, 3);
}

export function getTotalSessionsPlayed(sessions: CashSessionWithMember[]) {
  const uniqueSessions = new Set(sessions.map((session) => session.weekId));
  return uniqueSessions.size;
}

export function getTotalBuyIns(sessions: CashSessionWithMember[]) {
  return sessions.reduce((acc, session) => acc + session.buyIn, 0);
}

export function calculateAverageWin(sessions: CashSessionWithMember[]) {
  const positiveSessions = sessions.filter((session) => session.netProfit > 0);
  const totalProfit = positiveSessions.reduce(
    (acc, session) => acc + session.netProfit,
    0
  );
  return totalProfit / positiveSessions.length;
}

export function calculateAverageLoss(sessions: CashSessionWithMember[]) {
  const negativeSessions = sessions.filter((session) => session.netProfit < 0);
  const totalProfit = negativeSessions.reduce(
    (acc, session) => acc + session.netProfit,
    0
  );
  return totalProfit / negativeSessions.length;
}

export function getSessionLeader(sessions: CashSessionWithMember[]) {
  const sessionLeaders = sessions.reduce(
    (acc, session) => {
      if (!acc[session.memberId]) {
        acc[session.memberId] = 0;
      }
      acc[session.memberId] += session.netProfit;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedLeaders = Object.entries(sessionLeaders).sort(
    ([, a], [, b]) => b - a
  );

  return sortedLeaders[0];
}

export function combineLeaderStats(sessions: CashSessionWithFullMember[]) {
  const combinedStats = sessions.reduce(
    (acc, session) => {
      acc.buyIn += session.buyIn;
      acc.cashOut += session.cashOut;
      acc.netProfit += session.netProfit;
      acc.rebuys += session.rebuys;
      acc.member = session.member;
      acc.sessionsPlayed = sessions.length;
      acc.wins += session.netProfit > 0 ? 1 : 0;
      acc.losses += session.netProfit < 0 ? 1 : 0;
      acc.grossProfit += session.netProfit > 0 ? session.netProfit : 0;
      acc.grossLoss += session.netProfit < 0 ? session.netProfit : 0;

      return acc;
    },
    {
      buyIn: 0,
      cashOut: 0,
      netProfit: 0,
      rebuys: 0,
      sessionsPlayed: 0,
      wins: 0,
      losses: 0,
      grossProfit: 0,
      grossLoss: 0,
      member: {
        firstName: "",
        lastName: "",
        portraitUrl: "",
      },
    }
  );

  return combinedStats;
}

export const calculateWinPercentage = (wins: number, losses: number) => {
  if (losses === 0) {
    return "100%";
  }
  if (wins === 0) {
    return "0%";
  }

  return ((wins / (wins + losses)) * 100).toFixed(0) + "%";
};

export const rankSessions = (sessions: CashSessionWithMember[]) => {
  return sessions.sort((a, b) => b.netProfit - a.netProfit);
};

export const calculatePOYPoints = (index: number, netProfit: number) => {
  return netProfit > 0
    ? netProfit + POYPointsMap[index + 1]
    : POYPointsMap[index + 1];
};
