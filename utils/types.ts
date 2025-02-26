export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  portrait_url: string;
};

export type Tournament = {
  id: string;
  date: Date;
  name: string;
  money_in_play: number;
  buy_ins: number;
  rebuys: number;
  player_count: number;
  season_id: string;
  places_payed: number;
};

export type TournamentSession = {
  id: string;
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  nlpi_points: number;
  poy_points: number;
  place: number;
};

export type CashSession = {
  id: string;
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  week_id: string;
  member_id: string;
  season_id: string;
  nlpi_points: number;
  poy_points: number;
};

export type CashSessionNLPI = {
  created_at: string;
  member_id: string;
  nlpi_points: number;
  week_number: number;
  year: number;
};

export type CashSessionWithWeek = CashSession & {
  week: {
    week_number: number;
  };
};

export type CumulativeCashStats = {
  member: Member;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  sessionsPlayed: number;
  totalRebuys: number;
  averageWin: number;
  averageLoss: number;
  averageBuyIn: number;
  wins: number;
  losses: number;
  winPercentage: number;
  winStreak: number;
  losingStreak: number;
  poyPoints: number;
};

export type CashSessionNoId = {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  week_id: string;
  member_id: string;
  season_id: string;
  nlpi_points: number;
  poy_points: number;
};

export type CashSessionWithMember = CashSession & {
  member: {
    first_name: string;
  };
};

export type CashSessionWithFullMember = CashSession & {
  member: Member;
};

export type Season = {
  id: string;
  year: number;
};

export type Week = {
  id: string;
  week_number: number;
  season_id: string;
};

export type SeasonCashStats = {
  member_id: string;
  first_name: string;
  portrait_url: string;
  poy_points: number;
  gross_profit: number;
  net_profit: number;
  gross_losses: number;
  sessions_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  win_streak: number;
  loss_streak: number;
  current_streak: string;
  avg_win: number;
  avg_loss: number;
  avg_buy_in: number;
  session_avg: number;
  avg_rebuys: number;
};

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

export type CareerCashStatsData = {
  id: string;
  buy_in: number;
  created_at: string;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  week: {
    id: string;
    week_number: number;
  };
  season: {
    id: string;
    year: number;
  };
  nlpi_points: number;
  poy_points: number;
  member: Member;
};

export type POYData = {
  member_id: string;
  first_name: string;
  last_name: string;
  last_week_rank: number;
  rank: number;
  cash_points: number;
  prev_cash_points: number;
  total_points: number;
  major_points: number;
  avg_cash_points: number;
  avg_major_points: number;
  avg_points: number;
  cash_played: number;
  majors_played: number;
  sessions_played: number;
};

export type CashSessionWeekData = {
  date: string;
  week: number;
  year: number;
  sessions: {
    buy_in: number;
    cash_out: number;
    net_profit: number;
    rebuys: number;
    first_name: string;
    last_name: string;
    portrait_url: string;
    member_id: string;
    nlpi_points: number;
    poy_points: number;
  }[];
};

export type MajorData = {
  id: string;
  name: string;
  date: string;
  places_payed: number;
  total_buy_ins: number;
  players: number;
  prize_pool: number;
  rebuys: number;
  year: number;
  sessions: {
    member_id: string;
    first_name: string;
    last_name: string;
    portrait_url: string;
    buy_in: number;
    cash_out: number;
    net_profit: number;
    rebuys: number;
    nlpi_points: number;
    poy_points: number;
    place: number;
  }[];
};

export type MajorsData = {
  id: string;
  date: string;
  name: string;
  players: number;
  prize_pool: number;
  total_buy_ins: number;
  winner: {
    first_name: string;
    last_name: string;
    portrait_url: string;
    member_id: string;
  };
};
