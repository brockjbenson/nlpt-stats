export type NLPIData = {
  cash_points: number;
  rank: number;
  last_year_rank: number;
  first_name: string;
  last_name: string;
  last_week_rank: number;
  member_id: string;
  divisor: number;
  major_divisor: number;
  cash_divisor: number;
  total_points: number;
  tournament_points: number;
  actual_sessions_played: number;
  session_coming_off: {
    cash_id: string;
    created_at: string;
    member_id: string;
    nlpi_points: number;
    net_profit: number;
    cash_out: number;
    buy_in: number;
    rebuys: number;
    week: number;
    season: number;
  };
};
