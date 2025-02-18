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
