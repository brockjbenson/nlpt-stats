import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  BlindStructure,
  BlindStructureLevel,
} from "@/features/clock/types";

// A template with its levels, in position order.
export type StructureWithLevels = BlindStructure & {
  levels: BlindStructureLevel[];
};

type StructureRow = BlindStructure & { levels: BlindStructureLevel[] | null };

const SELECT_WITH_LEVELS = "*, levels:_blind_levels(*)";

function withSortedLevels(row: StructureRow): StructureWithLevels {
  return {
    ...row,
    levels: [...(row.levels ?? [])].sort((a, b) => a.position - b.position),
  };
}

// Every template, by name. Returns a Supabase-style { data, error }.
export async function getStructures(
  db: SupabaseClient,
): Promise<
  | { data: StructureWithLevels[]; error: null }
  | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_blind_structures")
    .select(SELECT_WITH_LEVELS)
    .order("name");
  if (error) return { data: null, error };
  return { data: (data as StructureRow[]).map(withSortedLevels), error: null };
}

// One template, or data null when it doesn't exist.
export async function getStructure(
  db: SupabaseClient,
  id: string,
): Promise<
  | { data: StructureWithLevels | null; error: null }
  | { data: null; error: PostgrestError }
> {
  const { data, error } = await db
    .from("_blind_structures")
    .select(SELECT_WITH_LEVELS)
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error };
  return {
    data: data ? withSortedLevels(data as StructureRow) : null,
    error: null,
  };
}
