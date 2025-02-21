// Define types for session and POY data
type CashSession = {
  poy_points: number;
  created_at: string;
  net_profit: number;
};

type TournamentSession = {
  poy_points: number;
  date: string;
};

type POYData = {
  member_id: string;
  first_name: string;
  all_cash_sessions: CashSession[];
  all_tournament_sessions: TournamentSession[];
};

export type ProcessedPOYData = {
  member_id: string;
  first_name: string;
  cash_points: number;
  tournament_points: number;
  bonusPoints: number;
  total: number;
  pointsBehind: number;
  lastWeekTotal: number;
  cashSessionsPlayed: number;
  tournamentSessionsPlayed: number;
  rank: number;
  lastWeekRank: number;
};

// Main function to process POY data
export const getPOYData = (poyData: POYData[]): ProcessedPOYData[] => {
  const currentPointsLeader = getCurrentPointsLeader(poyData);

  // Step 1: Calculate points and prepare data
  const processedData: ProcessedPOYData[] = poyData.map((data) => {
    const netProfit = data.all_cash_sessions.reduce(
      (acc, session) => acc + session.net_profit,
      0
    );

    const bonusPoints = netProfit > 0 ? netProfit / 2 : 0;
    const cash_points =
      data.all_cash_sessions.reduce(
        (acc, session) => acc + session.poy_points,
        0
      ) + bonusPoints;

    const tournament_points = data.all_tournament_sessions.reduce(
      (acc, session) => acc + session.poy_points,
      0
    );

    const mostRecentSession = getMostRecentSession(data);

    const total = cash_points + tournament_points;
    const lastWeekTotal = total - mostRecentSession.poy_points;
    const pointsBehind =
      currentPointsLeader.total > total ? currentPointsLeader.total - total : 0;

    // Count only sessions with poy_points > 0
    const cashSessionsPlayed = data.all_cash_sessions.filter(
      (session) => session.poy_points > 0
    ).length;

    const tournamentSessionsPlayed = data.all_tournament_sessions.filter(
      (session) => session.poy_points > 0
    ).length;

    return {
      first_name: data.first_name,
      member_id: data.member_id,
      cash_points,
      tournament_points,
      bonusPoints,
      total,
      pointsBehind,
      lastWeekTotal,
      cashSessionsPlayed,
      tournamentSessionsPlayed,
      rank: 0, // Placeholder for rank assignment
      lastWeekRank: 0, // Placeholder for last week's rank assignment
    };
  });

  // Step 2: Assign ranks based on total points
  assignRanks(processedData, "total", "rank");

  // Step 3: Assign last week's ranks based on lastWeekTotal
  assignRanks(processedData, "lastWeekTotal", "lastWeekRank");

  // Step 4: Sort back by current rank for consistency
  return processedData.sort((a, b) => a.rank - b.rank);
};

// Utility function to assign ranks
const assignRanks = (
  data: ProcessedPOYData[],
  key: "total" | "lastWeekTotal",
  rankKey: "rank" | "lastWeekRank"
): void => {
  data.sort((a, b) => b[key] - a[key]);

  let currentRank = 1;
  let previousValue: number | null = null;

  data.forEach((player, index) => {
    if (player[key] === previousValue) {
      player[rankKey] = currentRank;
    } else {
      currentRank = index + 1;
      player[rankKey] = currentRank;
    }
    previousValue = player[key];
  });
};

// Utility to get the current points leader
const getCurrentPointsLeader = (data: POYData[]): { total: number } => {
  return data
    .map((player) => {
      const bonusPoints = player.all_cash_sessions.reduce(
        (acc, session) => acc + session.net_profit,
        0
      );
      const totalPoints =
        player.all_cash_sessions.reduce(
          (acc, session) => acc + session.poy_points,
          0
        ) +
        player.all_tournament_sessions.reduce(
          (acc, session) => acc + session.poy_points,
          0
        ) +
        (bonusPoints > 0 ? bonusPoints / 2 : 0);
      return { total: totalPoints };
    })
    .reduce((max, player) => (player.total > max.total ? player : max), {
      total: 0,
    });
};

// Utility to find the most recent session from both cash and tournament sessions
const getMostRecentSession = (
  data: POYData
): CashSession | TournamentSession => {
  const mostRecentCash = data.all_cash_sessions.reduce((latest, session) => {
    return new Date(session.created_at) > new Date(latest.created_at)
      ? session
      : latest;
  }, data.all_cash_sessions[0]);

  const mostRecentTournament = data.all_tournament_sessions.reduce(
    (latest, session) => {
      return new Date(session.date) > new Date(latest.date) ? session : latest;
    },
    data.all_tournament_sessions[0]
  );

  return new Date(mostRecentCash.created_at) >
    new Date(mostRecentTournament.date)
    ? mostRecentCash
    : mostRecentTournament;
};
