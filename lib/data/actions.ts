"use server";

import { getCurrentUser } from "@/utils/supabase/user";
import { updateTag } from "next/cache";
import { LEAGUE_DATA_TAG } from "./cache";

// For admin screens that save straight from the browser: call this after a
// successful save so the public pages show the change on their next load.
// Server actions that write call updateTag(LEAGUE_DATA_TAG) themselves.
export async function refreshLeagueData() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return;
  updateTag(LEAGUE_DATA_TAG);
}
