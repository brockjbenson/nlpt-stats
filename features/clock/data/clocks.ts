import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parseLevels } from "@/features/clock/lib/levels";
import type { ClockStatus, TournamentClock } from "@/features/clock/types";

// A clock as the list shows it: no levels or settings.
export type ClockSummary = {
  id: string;
  name: string;
  status: ClockStatus;
  created_at: string;
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

// Every clock, newest first. Returns a Supabase-style { data, error }.
export async function getClocks(
  db: SupabaseClient,
): Promise<
  { data: ClockSummary[]; error: null } | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_tournament_clocks")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error };
  return { data: data as ClockSummary[], error: null };
}

// One clock, or data null when it doesn't exist.
export async function getClock(
  db: SupabaseClient,
  id: string,
): Promise<
  | { data: TournamentClock | null; error: null }
  | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_tournament_clocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toClock(data as ClockRow) : null, error: null };
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
