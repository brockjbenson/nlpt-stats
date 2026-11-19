import type { CashSession, Member, Season, Week } from "@/utils/types";
import { createPublicClient } from "@/utils/supabase/public";
import { selectTournamentsWithSessions } from "@/utils/tournament/queries";
import { leagueCache, leagueQuery, must, type DbResponse } from "./cache";

// Cached reads of public league data, one per query the pages run. Each one
// passes exactly the arguments its page passed before: several database
// functions have overloads chosen by which arguments are given.
// See ./cache.ts for how a query is cached and how a failure is handled.

// --- Shared ---

export const getSeasons = leagueQuery(async () => {
  "use cache";
  leagueCache();
  return must((db): DbResponse<Season[]> => db.from("season").select("*"));
});

export const getMembers = leagueQuery(async () => {
  "use cache";
  leagueCache();
  return must((db): DbResponse<Member[]> => db.from("members").select("*"));
});

// --- Home ---

export const getRecentCashSessionInfo = leagueQuery(async () => {
  "use cache";
  leagueCache();
  return must((db) => db.rpc("get_recent_cash_session_info"));
});

// --- Members ---

export type MemberWithDebut = Member & { debutDate: string | null };

// Visible members by first name, each with the date of their first session.
// Cached as one entry so the per-member lookups only run on a cache miss.
export const getMemberDirectory = leagueQuery(async () => {
  "use cache";
  leagueCache();
  const members = await must(
    (db): DbResponse<Member[]> =>
      db
        .from("members")
        .select("*")
        .order("first_name", { ascending: true })
        .eq("visible", true),
  );

  const db = createPublicClient();
  return Promise.all(
    members.map(async (member): Promise<MemberWithDebut> => {
      // A missing debut date shows as blank rather than failing the page.
      const { data: debutDate } = await db.rpc("get_member_debut_date", {
        target_member_id: member.id,
      });
      return { ...member, debutDate: debutDate?.[0]?.created_at || null };
    }),
  );
});

export const getMember = leagueQuery(async (id: string) => {
  "use cache";
  leagueCache();
  return must(
    (db): DbResponse<Member> =>
      db.from("members").select("*").eq("id", id).single(),
  );
});

export const getMemberDebutDate = leagueQuery(async (memberId: string) => {
  "use cache";
  leagueCache();
  return must((db) =>
    db.rpc("get_member_debut_date", { target_member_id: memberId }),
  );
});

export const getCareerData = leagueQuery(
  async (memberId: string, seasonId: string) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_career_data", {
        target_member_id: memberId,
        current_season_id: seasonId,
      }),
    );
  },
);

export const getStatAvgs = leagueQuery(async () => {
  "use cache";
  leagueCache();
  return must((db) => db.rpc("get_stat_avgs"));
});

export const getMemberAdvancedSkills = leagueQuery(async (memberId: string) => {
  "use cache";
  leagueCache();
  return must((db) =>
    db.rpc("get_member_advanced_skills", { target_member_id: memberId }),
  );
});

// --- NLPI / POY / Records ---

// Everyone's NLPI for a season (the NLPI page).
export const getNlpiInfo = leagueQuery(async (seasonId: string) => {
  "use cache";
  leagueCache();
  return must((db) =>
    db.rpc("get_nlpi_info", {
      current_season_id: seasonId,
      target_filter_date: null,
    }),
  );
});

// One member's NLPI for a season (the member page).
export const getMemberNlpiInfo = leagueQuery(
  async (seasonId: string, memberId: string) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_nlpi_info", {
        current_season_id: seasonId,
        target_filter_date: null,
        target_member_id: memberId,
      }),
    );
  },
);

// A season's POY standings; memberId null for everyone.
export const getPoyInfo = leagueQuery(
  async (seasonId: string, memberId: string | null) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_poy_info", {
        current_season_id: seasonId,
        target_member_id: memberId,
      }),
    );
  },
);

// NLPI rank records; memberId null for everyone (the records page).
export const getNlpiRankRecords = leagueQuery(
  async (memberId: string | null) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_nlpi_rank_records", { target_member_id: memberId }),
    );
  },
);

export const getPoyRecords = leagueQuery(async () => {
  "use cache";
  leagueCache();
  return must((db) => db.rpc("get_poy_records"));
});

// --- Stats ---

// season is a season id, or "career" for all seasons.
export const getCareerStats = leagueQuery(
  async (view: string, season: string) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_career_stats", {
        target_view: view,
        target_season: season,
      }),
    );
  },
);

// A season's cash sessions, or every season's when seasonId is null.
export const getCashSessions = leagueQuery(async (seasonId: string | null) => {
  "use cache";
  leagueCache();
  return must((db): DbResponse<CashSession[]> => {
    const query = db.from("cash_session").select("*");
    return seasonId ? query.eq("season_id", seasonId) : query;
  });
});

// A season's weeks, or every season's when seasonId is null.
export const getWeeks = leagueQuery(async (seasonId: string | null) => {
  "use cache";
  leagueCache();
  return must((db): DbResponse<Week[]> => {
    const query = db.from("week").select("*");
    return seasonId ? query.eq("season_id", seasonId) : query;
  });
});

// --- Tournaments ---

// A season's tournaments with their members' results, or every season's when
// seasonId is null.
export const getTournaments = leagueQuery(async (seasonId: string | null) => {
  "use cache";
  leagueCache();
  return must((db) => selectTournamentsWithSessions(db, seasonId));
});

export const getMajorData = leagueQuery(
  async (tournamentId: string | undefined) => {
    "use cache";
    leagueCache();
    return must((db) =>
      db.rpc("get_major_data", { target_tournament_id: tournamentId }),
    );
  },
);
