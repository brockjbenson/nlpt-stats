import type { CashSession, Member, Season, Week } from "@/utils/types";
import { cachedQuery, type DbResponse } from "./cache";

// Cached reads of public league data, one per query the pages run. Each one
// passes exactly the arguments its page passed before: several database
// functions have overloads chosen by which arguments are given.

// --- Shared ---

export const getSeasons = cachedQuery(
  "seasons",
  (db): DbResponse<Season[]> => db.from("season").select("*"),
);

export const getMembers = cachedQuery(
  "members",
  (db): DbResponse<Member[]> => db.from("members").select("*"),
);

// --- Home ---

export const getRecentCashSessionInfo = cachedQuery(
  "recent-cash-session-info",
  (db) => db.rpc("get_recent_cash_session_info"),
);

// --- Members ---

export type MemberWithDebut = Member & { debutDate: string | null };

// Visible members by first name, each with the date of their first session.
// Cached as one entry so the per-member lookups only run on a cache miss.
export const getMemberDirectory = cachedQuery(
  "member-directory",
  async (db) => {
    const { data, error } = await db
      .from("members")
      .select("*")
      .order("first_name", { ascending: true })
      .eq("visible", true);
    if (error) return { data: null, error };

    const members: MemberWithDebut[] = await Promise.all(
      (data as Member[]).map(async (member) => {
        const { data: debutDate } = await db.rpc("get_member_debut_date", {
          target_member_id: member.id,
        });
        return { ...member, debutDate: debutDate?.[0]?.created_at || null };
      }),
    );
    return { data: members, error: null };
  },
);

export const getMember = cachedQuery(
  "member",
  (db, id: string): DbResponse<Member> =>
    db.from("members").select("*").eq("id", id).single(),
);

export const getMemberDebutDate = cachedQuery(
  "member-debut-date",
  (db, memberId: string) =>
    db.rpc("get_member_debut_date", { target_member_id: memberId }),
);

export const getCareerData = cachedQuery(
  "career-data",
  (db, memberId: string, seasonId: string) =>
    db.rpc("get_career_data", {
      target_member_id: memberId,
      current_season_id: seasonId,
    }),
);

export const getStatAvgs = cachedQuery("stat-avgs", (db) =>
  db.rpc("get_stat_avgs"),
);

export const getMemberAdvancedSkills = cachedQuery(
  "member-advanced-skills",
  (db, memberId: string) =>
    db.rpc("get_member_advanced_skills", { target_member_id: memberId }),
);

// --- NLPI / POY / Records ---

// Everyone's NLPI for a season (the NLPI page).
export const getNlpiInfo = cachedQuery("nlpi-info", (db, seasonId: string) =>
  db.rpc("get_nlpi_info", {
    current_season_id: seasonId,
    target_filter_date: null,
  }),
);

// One member's NLPI for a season (the member page).
export const getMemberNlpiInfo = cachedQuery(
  "member-nlpi-info",
  (db, seasonId: string, memberId: string) =>
    db.rpc("get_nlpi_info", {
      current_season_id: seasonId,
      target_filter_date: null,
      target_member_id: memberId,
    }),
);

// A season's POY standings; memberId null for everyone.
export const getPoyInfo = cachedQuery(
  "poy-info",
  (db, seasonId: string, memberId: string | null) =>
    db.rpc("get_poy_info", {
      current_season_id: seasonId,
      target_member_id: memberId,
    }),
);

// NLPI rank records; memberId null for everyone (the records page).
export const getNlpiRankRecords = cachedQuery(
  "nlpi-rank-records",
  (db, memberId: string | null) =>
    db.rpc("get_nlpi_rank_records", { target_member_id: memberId }),
);

export const getPoyRecords = cachedQuery("poy-records", (db) =>
  db.rpc("get_poy_records"),
);

// --- Stats ---

// season is a season id, or "career" for all seasons.
export const getCareerStats = cachedQuery(
  "career-stats",
  (db, view: string, season: string) =>
    db.rpc("get_career_stats", {
      target_view: view,
      target_season: season,
    }),
);

// A season's cash sessions, or every season's when seasonId is null.
export const getCashSessions = cachedQuery(
  "cash-sessions",
  (db, seasonId: string | null): DbResponse<CashSession[]> => {
    const query = db.from("cash_session").select("*");
    return seasonId ? query.eq("season_id", seasonId) : query;
  },
);

// A season's weeks, or every season's when seasonId is null.
export const getWeeks = cachedQuery(
  "weeks",
  (db, seasonId: string | null): DbResponse<Week[]> => {
    const query = db.from("week").select("*");
    return seasonId ? query.eq("season_id", seasonId) : query;
  },
);

// --- Tournaments ---

// A season's tournaments with their sessions and season year, or every
// season's when seasonId is null.
export const getTournaments = cachedQuery(
  "tournaments",
  (db, seasonId: string | null) => {
    const query = db
      .from("tournaments")
      .select("*, tournament_sessions(*), season(year)");
    return seasonId ? query.eq("season_id", seasonId) : query;
  },
);

export const getMajorData = cachedQuery(
  "major-data",
  (db, tournamentId: string | undefined) =>
    db.rpc("get_major_data", { target_tournament_id: tournamentId }),
);
