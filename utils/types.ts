export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  portraitUrl: string;
};

export type CashSession = {
  id: string;
  buyIn: number;
  cashOut: number;
  netProfit: number;
  rebuys: number;
  weekId: string;
  memberId: string;
  seasonId: string;
  nlpiPoints: number;
  poyPoints: number;
};

export type CashSessionNoId = {
  buyIn: number;
  cashOut: number;
  netProfit: number;
  rebuys: number;
  weekId: string;
  memberId: string;
  seasonId: string;
  nlpiPoints: number;
  poyPoints: number;
};

export type CashSessionWithMember = CashSession & {
  member: {
    firstName: string;
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
  weekNumber: number;
  seasonId: string;
};
