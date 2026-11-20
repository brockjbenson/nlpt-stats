import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/features/clock/data/clocks";
import type { MemberName } from "@/features/clock/lib/players";
import type { ClockEntrant, ClockKnockout } from "@/features/clock/types";

type Rows<T> =
  | { data: T[]; error: null }
  | { data: null; error: PostgrestError };

// A member the screens can name, and whether they show in the add list.
export type MemberOption = MemberName & { visible: boolean };

// Every player in a clock, in the order they were added.
export async function getEntrants(
  db: SupabaseClient,
  clockId: string,
): Promise<Rows<ClockEntrant>> {
  const { data, error } = await db
    .from("_clock_entrants")
    .select("*")
    .eq("clock_id", clockId)
    .order("created_at");
  if (error) return { data: null, error };
  return { data: data as ClockEntrant[], error: null };
}

// Every knockout in a clock, oldest first.
export async function getKnockouts(
  db: SupabaseClient,
  clockId: string,
): Promise<Rows<ClockKnockout>> {
  const { data, error } = await db
    .from("_clock_knockouts")
    .select("*")
    .eq("clock_id", clockId)
    .order("busted_at");
  if (error) return { data: null, error };
  return { data: data as ClockKnockout[], error: null };
}

// The PostgREST filter for getMemberNames: visible members, plus the
// members already playing (who may since have been hidden). Only real ids
// go into the filter text.
export function memberNamesFilter(playingMemberIds: string[]): string {
  const ids = [...new Set(playingMemberIds.filter(isUuid))];
  return ids.length === 0
    ? "visible.eq.true"
    : `visible.eq.true,id.in.(${ids.join(",")})`;
}

// Members to name and pick from, by first name: everyone visible, and any
// hidden member already playing in the clock so their name still shows.
export async function getMemberNames(
  db: SupabaseClient,
  playingMemberIds: string[],
): Promise<Rows<MemberOption>> {
  const { data, error } = await db
    .from("members")
    .select("id, first_name, last_name, visible")
    .or(memberNamesFilter(playingMemberIds))
    .order("first_name")
    .order("last_name");
  if (error) return { data: null, error };
  return {
    data: (data as (MemberName & { visible: boolean | null })[]).map(
      (member) => ({ ...member, visible: member.visible === true }),
    ),
    error: null,
  };
}

// Applies a Realtime insert or update to a list: replaces the row with the
// same id where it is, or adds it at the end.
export function upsertRow<T extends { id: string }>(rows: T[], row: T): T[] {
  return rows.some(({ id }) => id === row.id)
    ? rows.map((current) => (current.id === row.id ? row : current))
    : [...rows, row];
}

// Applies a Realtime delete to a list.
export function removeRow<T extends { id: string }>(
  rows: T[],
  id: string,
): T[] {
  return rows.filter((row) => row.id !== id);
}
