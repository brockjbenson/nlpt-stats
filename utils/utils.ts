import { redirect } from "next/navigation";
import {
  CashSession,
  CashSessionNoId,
  CashSessionWithFullMember,
  CashSessionWithMember,
  CashSessionWithWeek,
  Member,
  TournamentSession,
} from "./types";

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
    ? "text-theme-green"
    : profit < 0
      ? "text-theme-red"
      : "text-muted";
}

export function getRankTextColor(rank: number) {
  return rank === 1
    ? "text-yellow-400"
    : rank === 2
      ? "text-gray-300"
      : rank === 3
        ? "text-orange-500"
        : "text-muted";
}

export function formatMoney(amount: number) {
  return amount >= 0
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$(${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
}

export function getBottomThree(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => a.net_profit - b.net_profit).slice(0, 3);
}

export function getBiggestLoser(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => a.net_profit - b.net_profit).slice(0, 1);
}

export function getTopThree(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => b.net_profit - a.net_profit).slice(0, 3);
}

export function getTopPerformer(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.sort((a, b) => b.net_profit - a.net_profit).slice(0, 1);
}

export function getTotalSessionsPlayed(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const uniqueSessions = new Set(
    sessionsCopy.map((session) => session.week_id)
  );
  return uniqueSessions.size;
}

export function getTotalBuyIns(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  return sessionsCopy.reduce((acc, session) => acc + session.buy_in, 0);
}

export function calculateAverageWin(sessions: CashSessionWithMember[]) {
  const sessionsCopy = [...sessions];
  const positiveSessions = sessionsCopy.filter(
    (session) => session.net_profit > 0
  );
  const totalProfit = positiveSessions.reduce(
    (acc, session) => acc + session.net_profit,
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
    (session) => session.net_profit < 0
  );
  const totalProfit = negativeSessions.reduce(
    (acc, session) => acc + session.net_profit,
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
      if (!acc[session.member_id]) {
        acc[session.member_id] = 0;
      }
      acc[session.member_id] += session.net_profit;
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
      acc.buyIn += session.buy_in;
      acc.cashOut += session.cash_out;
      acc.netProfit += session.net_profit;
      acc.rebuys += session.rebuys;
      acc.member = {
        firstName: session.member.first_name,
        lastName: session.member.last_name,
        portraitUrl: session.member.portrait_url,
      };
      acc.sessionsPlayed = sessions.length;
      acc.wins += session.net_profit > 0 ? 1 : 0;
      acc.losses += session.net_profit < 0 ? 1 : 0;
      acc.grossProfit += session.net_profit > 0 ? session.net_profit : 0;
      acc.grossLoss += session.net_profit < 0 ? session.net_profit : 0;

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
    if (session.net_profit > 0) {
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
    if (session.net_profit < 0) {
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
  const sessionsByWeek = sessions.reduce<Record<string, CashSessionNoId[]>>(
    (acc, session) => {
      const { week_id } = session;
      if (!acc[week_id]) {
        acc[week_id] = [];
      }
      acc[week_id].push(session);
      return acc;
    },
    {}
  );

  const rankedSessions = Object.values(sessionsByWeek).flatMap(
    (weekSessions) => {
      const sortedSessions = [...weekSessions].sort(
        (a, b) => b.net_profit - a.net_profit
      );

      return sortedSessions.map((session, index) => ({
        ...session,
        rank: session.rebuys === 0 ? 0 : index + 1,
      }));
    }
  );

  return rankedSessions;
};

export const calculatePOYPoints = (netProfit: number) => {
  return netProfit > 0 ? netProfit : 0;
};

export const getPOYPointsLeaders = (
  sessions: CashSession[],
  memberIds: any[],
  members: Member[]
) => {
  const sessionsCopy = [...sessions];

  const sessionsByMember = memberIds.reduce<Record<string, CashSession[]>>(
    (acc, memberId) => {
      acc[memberId] = sessionsCopy.filter(
        (session) => session.member_id === memberId
      );
      return acc;
    },
    {}
  );

  const memberPOYPoints = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];

    const totalPOYPoints = allSessions.reduce(
      (sum, session) => sum + session.poy_points,
      0
    );

    const netProfit = allSessions.reduce(
      (sum, session) => sum + session.net_profit,
      0
    );

    const bonusPoints = netProfit > 0 ? netProfit / 2 : 0;

    return {
      id: member.id,
      name: `${member.first_name}`,
      image: member.portrait_url,
      totalPOYPoints: parseFloat((totalPOYPoints + bonusPoints).toFixed(2)),
    };
  });

  return memberPOYPoints
    .filter((member) => member.totalPOYPoints > 0)
    .sort((a, b) => b.totalPOYPoints - a.totalPOYPoints)
    .map((member, index) => ({
      ...member,
      currentRank: index + 1, // Add rank
    }));
};

export const getPOYPointsLeadersWithTournaments = (
  sessions: CashSession[],
  memberIds: any[],
  members: Member[],
  tournamentSessions: {
    id: string;
    poy_points: number;
    member_id: string;
    season_id: string;
    tournament_id: string;
    date: string;
  }[]
) => {
  const sessionsCopy = [...sessions];

  const sessionsByMember = memberIds.reduce<Record<string, CashSession[]>>(
    (acc, memberId) => {
      acc[memberId] = sessionsCopy.filter(
        (session) => session.member_id === memberId
      );
      return acc;
    },
    {}
  );

  const tournamentSessionsByMember = memberIds.reduce<
    Record<
      string,
      {
        id: string;
        poy_points: number;
        member_id: string;
        season_id: string;
        tournament_id: string;
      }[]
    >
  >((acc, memberId) => {
    acc[memberId] = tournamentSessions.filter(
      (session) => session.member_id === memberId
    );
    return acc;
  }, {});

  const memberPOYPoints = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const allTournamentSessions = tournamentSessionsByMember[member.id] || [];

    const totalPOYPoints = allSessions.reduce(
      (sum, session) => sum + session.poy_points,
      0
    );

    const totalPOYPointsTournaments = allTournamentSessions.reduce(
      (sum, session) => sum + session.poy_points,
      0
    );

    const netProfit = allSessions.reduce(
      (sum, session) => sum + session.net_profit,
      0
    );

    const bonusPoints = netProfit > 0 ? netProfit / 2 : 0;

    return {
      id: member.id,
      name: `${member.first_name}`,
      image: member.portrait_url,
      cashPoints: parseFloat((totalPOYPoints + bonusPoints).toFixed(2)),
      tournamentPoints: parseFloat(totalPOYPointsTournaments.toFixed(2)),
      totalPOYPoints:
        parseFloat((totalPOYPoints + bonusPoints).toFixed(2)) +
        parseFloat(totalPOYPointsTournaments.toFixed(2)),
    };
  });

  return memberPOYPoints
    .filter((member) => member.totalPOYPoints > 0)
    .sort((a, b) => b.totalPOYPoints - a.totalPOYPoints)
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
      (session) => session.member_id === memberId
    );
    return acc;
  }, {});

  const memberNetProfit = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalNetProfit = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.net_profit,
      0
    );

    return {
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      image: member.portrait_url,
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
  members: Member[]
) => {
  const sessionWins = sessions.map((session) => ({
    memberId: session.member_id,
    name: `${members.find((member) => member.id === session.member_id)?.first_name} ${members.find((member) => member.id === session.member_id)?.last_name}`,
    netProfit: session.net_profit,
    image: members.find((member) => member.id === session.member_id)
      ?.portrait_url,
    weekNumber: session.week?.week_number || null,
  }));

  const sortedSessionWins = [...sessionWins].sort(
    (a, b) => b.netProfit - a.netProfit
  );

  return sortedSessionWins.map((session, index) => ({
    ...session,
    currentRank: index + 1,
  }));
};

export const getLargestWins = (
  sessions: CashSessionWithWeek[],
  members: Member[]
) => {
  const sessionWins = sessions.map((session) => ({
    memberId: session.member_id,
    name: `${members.find((member) => member.id === session.member_id)?.first_name} ${members.find((member) => member.id === session.member_id)?.last_name}`,
    netProfit: session.net_profit,
    image: members.find((member) => member.id === session.member_id)
      ?.portrait_url,
    weekNumber: session.week?.week_number || null,
  }));

  const sortedSessionWins = [...sessionWins].sort(
    (a, b) => b.netProfit - a.netProfit
  );

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
      (session) => session.member_id === memberId
    );

    return acc;
  }, {});

  const memberStats = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalNetProfit = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.net_profit,
      0
    );
    const totalGrossProfit = allSessions.reduce(
      (sum: number, session: CashSession) =>
        sum + (session.net_profit > 0 ? session.net_profit : 0),
      0
    );
    const totalGrossLoss = allSessions.reduce(
      (sum: number, session: CashSession) =>
        sum + (session.net_profit < 0 ? session.net_profit : 0),
      0
    );
    const totalRebuys = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.rebuys,
      0
    );
    const wins = allSessions.filter(
      (session: CashSession) => session.net_profit > 0
    ).length;
    const losses = allSessions.filter(
      (session: CashSession) => session.net_profit < 0
    ).length;
    const poyPoints = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.poy_points,
      0
    );
    const avgBuyIn = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.buy_in,
      0
    );
    const sessionsPlayed = allSessions.reduce(
      (sum: number, session: CashSession) =>
        session.buy_in === 0 ? sum : sum + 1,
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

export function getOrdinalSuffix(num: number): string {
  if (num % 100 >= 11 && num % 100 <= 13) {
    return `${num}th`;
  }

  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}
