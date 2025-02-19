"use client";

import { createClient } from "@/utils/supabase/client";
import { SessionNoId } from "@/utils/tournament/utils";
import { CashSession, CashSessionNoId } from "@/utils/types";

export const addSessionAction = async (sessions: CashSessionNoId[]) => {
  const db = createClient();

  const { error } = await db.from("cash_session").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Sessions added successfully" };
};

export const addTournamentSessionAction = async (sessions: SessionNoId[]) => {
  const db = createClient();

  const { error } = await db.from("tournament_sessions").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Sessions added successfully" };
};
