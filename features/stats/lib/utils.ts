import { StatsData } from "./types";

export const getStatsLeaders = (data: StatsData[]) => {
  const netProfit = [...data].sort((a, b) => b.net_profit - a.net_profit);

  const winPercentage = [...data].sort(
    (a, b) => b.win_percentage - a.win_percentage
  );

  const grossProfit = [...data].sort((a, b) => b.gross_profit - a.gross_profit);

  const sessionAvg = [...data].sort((a, b) => b.session_avg - a.session_avg);

  const wins = [...data].sort((a, b) => b.wins - a.wins);
  const sessionsPlayed = [...data].sort(
    (a, b) => b.sessions_played - a.sessions_played
  );

  return {
    netProfit,
    winPercentage,
    grossProfit,
    sessionAvg,
    wins,
    sessionsPlayed,
  };
};
