import { createClient } from "@/utils/supabase/server";

export default async function fetchMembersAction() {
  const db = await createClient();

  const { data, error } = await db.from("members").select("*");

  return {
    members: data ?? [],
    error: error ?? null,
  };
}
