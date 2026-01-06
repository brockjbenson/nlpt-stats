export type StatsData = {
  avg_buy_in: number;
  avg_loss: number;
  avg_rebuys: number;
  avg_win: number;
  first_name: string;
  gross_losses: number;
  gross_profit: number;
  losses: number;
  member_id: string;
  net_profit: number;
  portrait_url: string;
  session_avg: number;
  sessions_played: number;
  total_buy_ins: number;
  win_percentage: number;
  wins: number;
};

export type StatsLeaders = {
  netProfit: StatsData[];
  winPercentage: StatsData[];
  grossProfit: StatsData[];
  sessionAvg: StatsData[];
  wins: StatsData[];
  sessionsPlayed: StatsData[];
};
