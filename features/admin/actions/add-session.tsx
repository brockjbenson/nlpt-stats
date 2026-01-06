"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { SessionNoId } from "@/utils/tournament/utils";
import { CashSessionNoId } from "@/utils/types";

export const addSessionAction = async (sessions: CashSessionNoId[]) => {
  const db = await createClient();

  const { error } = await db.from("cash_session").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  // Revalidate specific pages
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page"); // Revalidates all year pages
  revalidatePath("/members/[id]", "page"); // Revalidates members page

  return { success: true, message: "Sessions added successfully" };
};

export const addTournamentSessionAction = async (sessions: SessionNoId[]) => {
  const db = await createClient();

  const { error } = await db.from("tournament_sessions").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  // Revalidate specific pages
  revalidatePath("/nlpi");
  revalidatePath("/poy/[year]", "page"); // Revalidates all year pages
  revalidatePath("/members/[id]", "page"); // Revalidates members page

  return { success: true, message: "Sessions added successfully" };
};
