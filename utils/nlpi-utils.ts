import { Tournament, TournamentSession } from "./types";

const NLPIPointsMap: Record<number, number> = {
  1: 10.5,
  2: 9,
  3: 7.75,
  4: 6.5,
  5: 5.5,
  6: 4.5,
  7: 3.75,
  8: 3,
  9: 2.5,
  10: 2,
  11: 1.5,
  12: 1,
  13: 1,
  14: 1,
  15: 1,
  16: 1,
  17: 1,
};

type NLPISession = {
  memberId: string;
  nlpiPoints: number;
  week: {
    weekNumber: number;
    id: string;
  }[];
  season: {
    year: number;
    id: string;
  }[];
};

export const calculateNLPIPoints = (rank: number, netProfit: number) => {
  if (rank === 0) {
    return 0;
  }
  const pointsOffPlacement = NLPIPointsMap[rank];
  return (netProfit / 5) * 0.6 + pointsOffPlacement;
};
