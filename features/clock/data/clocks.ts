import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parseLevels } from "@/features/clock/lib/levels";
import { LIVE_STATUSES } from "@/features/clock/lib/live";
import type { ClockStatus, TournamentClock } from "@/features/clock/types";

// A clock as the list shows it: no levels or settings, and its saved
// tournament, if any.
export type ClockSummary = {
  id: string;
  name: string;
  status: ClockStatus;
  created_at: string;
  // The tournament its results were saved as, if any.
  tournament: { id: string; date: string } | null;
};

// A _tournament_clocks row as Supabase returns it (from a query or a
// Realtime event): levels not yet checked, numeric columns possibly text.
export type ClockRow = Omit<
  TournamentClock,
  "levels" | "buy_in" | "rebuy" | "payout_pcts"
> & {
  levels: unknown;
  buy_in: number | string;
  rebuy: number | string;
  payout_pcts: (number | string)[];
};

// Checks a row's levels and turns its numeric columns into numbers. Throws
// when the levels are bad: the database should never hold any.
export function toClock(row: ClockRow): TournamentClock {
  return {
    ...row,
    levels: parseLevels(row.levels),
    buy_in: Number(row.buy_in),
    rebuy: Number(row.rebuy),
    payout_pcts: row.payout_pcts.map(Number),
  };
}

// Applies a Realtime update to the clock on screen. An update can leave
// out columns it didn't change (Postgres skips large unchanged values such
// as levels), so only the columns it carries are replaced.
export function mergeClockRow(
  current: TournamentClock,
  row: Partial<ClockRow>,
): TournamentClock {
  const changed = Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
  return toClock({ ...current, ...changed });
}

// Every clock, newest first. Returns a Supabase-style { data, error }.
export async function getClocks(
  db: SupabaseClient,
): Promise<
  { data: ClockSummary[]; error: null } | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_tournament_clocks")
    .select("id, name, status, created_at, tournament:_tournaments(id, date)")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error };
  // Without generated types, Supabase guesses the embedded tournament is a
  // list; it's one row (or null), since a clock links to one tournament.
  return { data: data as unknown as ClockSummary[], error: null };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Whether id looks like a database id; anything else can't match a row.
export function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

// One clock, or data null when it doesn't exist (including a link whose id
// isn't a uuid, which the database would report as an error).
export async function getClock(
  db: SupabaseClient,
  id: string,
): Promise<
  | { data: TournamentClock | null; error: null }
  | { data: null; error: PostgrestError }
> {
  if (!isUuid(id)) return { data: null, error: null };
  const { data, error } = await db
    .from("_tournament_clocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toClock(data as ClockRow) : null, error: null };
}

// The clocks a "Tournament live" banner can show: every running or paused
// clock. A failed query logs and returns none, so the banner just doesn't
// show.
export async function getLiveClocks(
  db: SupabaseClient,
): Promise<TournamentClock[]> {
  const { data, error } = await db
    .from("_tournament_clocks")
    .select("*")
    .in("status", LIVE_STATUSES);
  if (error) {
    console.error("Error loading live clocks:", error.message);
    return [];
  }
  return (data as ClockRow[]).map(toClock);
}

// The database's current time (server_now()), in ms. Throws when the call
// fails, since no clock time can be trusted without it.
export async function getServerNowMs(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("server_now");
  if (error) throw new Error(`server_now failed: ${error.message}`);
  const ms = Date.parse(data as string);
  if (Number.isNaN(ms)) throw new Error(`server_now returned ${String(data)}`);
  return ms;
}
