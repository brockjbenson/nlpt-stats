import { Member } from "../types";

const TournamentNLPIPointsMap: Record<number, number> = {
  1: 50,
  2: 40,
  3: 32,
  4: 26,
  5: 20,
  6: 16,
  7: 12,
  8: 10,
  9: 8,
  10: 6,
  11: 4,
  12: 2,
  13: 1,
  14: 1,
  15: 1,
  16: 1,
};

const TournamentPOYPointsMap: Record<number, number> = {
  1: 200,
  2: 150,
  3: 110,
  4: 80,
  5: 60,
  6: 50,
  7: 45,
  8: 42.5,
  9: 40,
  10: 38,
  11: 34,
  12: 30,
  13: 26,
  14: 20,
  15: 15,
  16: 10,
};

export type SessionNoPointsOrId = {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
};

export type SessionNoId = {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
  nlpi_points: number;
  poy_points: number;
};

export const assignTournamentSessionPoints = (
  sessions: SessionNoPointsOrId[]
) => {
  return sessions.map((session) => {
    return {
      ...session,
      nlpi_points: TournamentNLPIPointsMap[session.place],
      poy_points: TournamentPOYPointsMap[session.place],
    };
  });
};

export const assignTournamentNLPIPointsToSessions = (
  sessions: SessionNoPointsOrId[]
) => {
  const sortedSessions = sessions.sort((a, b) => b.place - a.place);
  return sortedSessions.map((session) => ({
    ...session,
    nlpi_points: TournamentNLPIPointsMap[session.place],
  }));
};

export const assignTournamentPOYPointsToSessions = (
  sessions: SessionNoPointsOrId[]
) => {
  const sortedSessions = sessions.sort((a, b) => b.place - a.place);
  return sortedSessions.map((session) => ({
    ...session,
    poy_points: TournamentPOYPointsMap[session.place],
  }));
};

export const fillInMissingTournamentSessions = (
  sessions: SessionNoId[],
  members: Member[]
) => {
  const filledSessions: SessionNoId[] = [];
  const membersWithMissingSessions = members.filter((member) => {
    return !sessions.some((session) => session.member_id === member.id);
  });

  membersWithMissingSessions.forEach((member) => {
    filledSessions.push({
      buy_in: 0,
      cash_out: 0,
      member_id: member.id,
      net_profit: 0,
      place: 0,
      nlpi_points: 0,
      poy_points: 0,
      rebuys: 0,
      tournament_id: sessions[0].tournament_id,
    });
  });

  return [...sessions, ...filledSessions];
};
