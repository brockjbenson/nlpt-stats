import { redirect } from "next/navigation";
import {
  CashSession,
  CashSessionNoId,
  CashSessionWithFullMember,
  CashSessionWithMember,
  CashSessionWithWeek,
  Member,
} from "./types";

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
  15: 1,
  16: 1,
  17: 1,
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
  return amount >= 0
    ? `$${amount.toFixed(2)}`
    : `$(${(amount * -1).toFixed(2)})`;
}

export function getBottomThree(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => a.netProfit - b.netProfit).slice(0, 3);
}

export function getTopThree(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => b.netProfit - a.netProfit).slice(0, 3);
}

export function getTotalSessionsPlayed(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const uniqueSessions = new Set(sessionsCopy.map((session) => session.weekId));
  return uniqueSessions.size;
}

export function getTotalBuyIns(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.reduce((acc, session) => acc + session.buyIn, 0);
}

export function calculateAverageWin(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const positiveSessions = sessionsCopy.filter(
    (session) => session.netProfit > 0
  );
  const totalProfit = positiveSessions.reduce(
    (acc, session) => acc + session.netProfit,
    0
  );
  if (totalProfit === 0) {
    return 0;
  }
  return totalProfit / positiveSessions.length;
}

export function calculateAverageLoss(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const negativeSessions = sessionsCopy.filter(
    (session) => session.netProfit < 0
  );
  const totalProfit = negativeSessions.reduce(
    (acc, session) => acc + session.netProfit,
    0
  );
  if (totalProfit === 0) {
    return 0;
  }
  return totalProfit / negativeSessions.length;
}

export function getSessionLeader(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const sessionLeaders = sessionsCopy.reduce(
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
  const sessionsCopy = [...sessions];
  const combinedStats = sessionsCopy.reduce(
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

export const calculateWinSteak = (sessions: CashSessionWithMember[]) => {
  let longestWinStreak = 0;
  let currentWinStreak = 0;
  const sessionsCopy = [...sessions];

  sessionsCopy.forEach((session) => {
    if (session.netProfit > 0) {
      currentWinStreak += 1;
    } else {
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      currentWinStreak = 0;
    }
  });

  return Math.max(longestWinStreak, currentWinStreak);
};

export const calculateLosingStreak = (sessions: CashSessionWithMember[]) => {
  let longestLosingStreak = 0;
  let currentLosingStreak = 0;
  const sessionsCopy = [...sessions];

  sessionsCopy.forEach((session) => {
    if (session.netProfit < 0) {
      currentLosingStreak += 1;
    } else {
      longestLosingStreak = Math.max(longestLosingStreak, currentLosingStreak);
      currentLosingStreak = 0;
    }
  });

  return Math.max(longestLosingStreak, currentLosingStreak);
};

export const calculateWinPercentage = (wins: number, losses: number) => {
  if (wins === 0 && losses === 0) {
    return 0;
  }
  if (losses === 0) {
    return 100;
  }
  if (wins === 0) {
    return 0;
  }

  return (wins / (wins + losses)) * 100;
};

export const rankSessions = (sessions: CashSessionNoId[]) => {
  // Group sessions by weekId
  const sessionsByWeek = sessions.reduce<Record<string, CashSessionNoId[]>>(
    (acc, session) => {
      const { weekId } = session;
      if (!acc[weekId]) {
        acc[weekId] = [];
      }
      acc[weekId].push(session);
      return acc;
    },
    {}
  );

  // Rank sessions within each weekId group
  const rankedSessions = Object.values(sessionsByWeek).flatMap(
    (weekSessions) => {
      // Sort sessions by netProfit in descending order
      const sortedSessions = [...weekSessions].sort(
        (a, b) => b.netProfit - a.netProfit
      );

      // Add rank to each session
      return sortedSessions.map((session, index) => ({
        ...session,
        rank: session.rebuys === 0 ? 0 : index + 1, // Rank 0 for sessions with rebuys = 0
      }));
    }
  );

  return rankedSessions;
};

export const calculatePOYPoints = (rank: number, netProfit: number) => {
  return netProfit > 0 ? netProfit + POYPointsMap[rank] : POYPointsMap[rank];
};

export const getPOYPointsLeaders = (
  sessions: CashSessionWithMember[],
  memberIds: any[],
  members: Member[]
) => {
  // Create a copy of sessions to ensure no external mutation
  const sessionsCopy = [...sessions];

  // Group sessions by memberId
  const sessionsByMember = memberIds.reduce<
    Record<string, CashSessionWithMember[]>
  >((acc, memberId) => {
    acc[memberId] = sessionsCopy.filter(
      (session) => session.memberId === memberId
    );
    return acc;
  }, {});

  // Calculate POY points for each member
  const memberPOYPoints = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];

    const totalPOYPoints = allSessions.reduce(
      (sum, session) => sum + session.poyPoints,
      0
    );

    const netProfit = allSessions.reduce(
      (sum, session) => sum + session.netProfit,
      0
    );

    const bonusPoints = netProfit > 0 ? netProfit / 2 : 0;

    return {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      image: member.portraitUrl,
      totalPOYPoints: parseFloat((totalPOYPoints + bonusPoints).toFixed(2)), // Convert to a number for accurate sorting
    };
  });

  // Filter and rank members by total POY points
  return memberPOYPoints
    .filter((member) => member.totalPOYPoints > 0) // Filter members with no points
    .sort((a, b) => b.totalPOYPoints - a.totalPOYPoints) // Sort descending
    .map((member, index) => ({
      ...member,
      currentRank: index + 1, // Add rank
    }));
};

export const getNetProfitLeaders = (
  sessions: CashSessionWithMember[],
  memberIds: any[],
  members: Member[]
) => {
  const sessionsCopy = [...sessions];
  const sessionsByMember = memberIds.reduce((acc, memberId) => {
    acc[memberId] = sessionsCopy.filter(
      (session) => session.memberId === memberId
    );
    return acc;
  }, {});

  const memberNetProfit = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalNetProfit = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.netProfit,
      0
    );

    return {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      image: member.portraitUrl,
      totalNetProfit,
    };
  });

  const filteredPOYMembers = memberNetProfit.filter(
    (member) => member.totalNetProfit > 0
  );

  return [...filteredPOYMembers]
    .sort((a, b) => b.totalNetProfit - a.totalNetProfit)
    .map((member, index) => ({
      ...member,
      currentRank: index + 1,
    }));
};

export const getBestAverageWins = (
  sessions: CashSessionWithWeek[],
  memberIds: any[],
  members: Member[]
) => {
  // Create a lookup for member names by ID for easier access
  const memberLookup = members.reduce(
    (acc, member) => {
      acc[member.id] = member.firstName;
      return acc;
    },
    {} as Record<string, string>
  );

  // Map each session to include member details and calculate the largest wins per session
  const sessionWins = sessions.map((session) => ({
    memberId: session.memberId,
    name: `${members.find((member) => member.id === session.memberId)?.firstName} ${members.find((member) => member.id === session.memberId)?.lastName}`,
    netProfit: session.netProfit,
    image: members.find((member) => member.id === session.memberId)
      ?.portraitUrl,
    weekNumber: session.week?.weekNumber || null, // Handle null/undefined week
  }));

  // Sort all sessions by netProfit in descending order
  const sortedSessionWins = [...sessionWins].sort(
    (a, b) => b.netProfit - a.netProfit
  );

  // Add ranking to each session
  return sortedSessionWins.map((session, index) => ({
    ...session,
    currentRank: index + 1,
  }));
};

export const getLargestWins = (
  sessions: CashSessionWithWeek[],
  memberIds: any[],
  members: Member[]
) => {
  // Create a lookup for member names by ID for easier access
  const memberLookup = members.reduce(
    (acc, member) => {
      acc[member.id] = member.firstName;
      return acc;
    },
    {} as Record<string, string>
  );

  // Map each session to include member details and calculate the largest wins per session
  const sessionWins = sessions.map((session) => ({
    memberId: session.memberId,
    name: `${members.find((member) => member.id === session.memberId)?.firstName} ${members.find((member) => member.id === session.memberId)?.lastName}`,
    netProfit: session.netProfit,
    image: members.find((member) => member.id === session.memberId)
      ?.portraitUrl,
    weekNumber: session.week?.weekNumber || null, // Handle null/undefined week
  }));

  // Sort all sessions by netProfit in descending order
  const sortedSessionWins = [...sessionWins].sort(
    (a, b) => b.netProfit - a.netProfit
  );

  // Add ranking to each session
  return sortedSessionWins.map((session, index) => ({
    ...session,
    currentRank: index + 1,
  }));
};

export const getCumulativeCashStats = (
  sessions: CashSessionWithMember[],
  memberIds: any[],
  members: Member[]
) => {
  const sessionsCopy = [...sessions];
  const sessionsByMember = memberIds.reduce((acc, memberId) => {
    acc[memberId] = sessionsCopy.filter(
      (session) => session.memberId === memberId
    );

    return acc;
  }, {});

  const memberStats = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalNetProfit = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.netProfit,
      0
    );
    const totalGrossProfit = allSessions.reduce(
      (sum: number, session: CashSession) =>
        sum + (session.netProfit > 0 ? session.netProfit : 0),
      0
    );
    const totalGrossLoss = allSessions.reduce(
      (sum: number, session: CashSession) =>
        sum + (session.netProfit < 0 ? session.netProfit : 0),
      0
    );
    const totalRebuys = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.rebuys,
      0
    );
    const wins = allSessions.filter(
      (session: CashSession) => session.netProfit > 0
    ).length;
    const losses = allSessions.filter(
      (session: CashSession) => session.netProfit < 0
    ).length;
    const poyPoints = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.poyPoints,
      0
    );
    const avgBuyIn = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.buyIn,
      0
    );
    const sessionsPlayed = allSessions.reduce(
      (sum: number, session: CashSession) =>
        session.buyIn === 0 ? sum : sum + 1,
      0
    );
    const avgWin = calculateAverageWin(allSessions);
    const avgLoss = calculateAverageLoss(allSessions);
    const winPercentage = calculateWinPercentage(wins, losses);
    const winStreak = calculateWinSteak(allSessions);
    const losingStreak = calculateLosingStreak(allSessions);

    return {
      member: member,
      netProfit: totalNetProfit,
      grossProfit: totalGrossProfit,
      grossLoss: totalGrossLoss,
      sessionsPlayed: sessionsPlayed,
      averageWin: avgWin,
      averageLoss: avgLoss,
      averageBuyIn: avgBuyIn / sessionsPlayed,
      totalRebuys,
      wins,
      losses,
      winPercentage,
      losingStreak,
      winStreak,
      poyPoints,
    };
  });

  return memberStats;
};
