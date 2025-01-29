"use client";

import { createClient } from "@/utils/supabase/client";
import { CashSession, CashSessionNoId } from "@/utils/types";

export const addSessionAction = async (sessions: CashSessionNoId[]) => {
  const db = createClient();

  const { error } = await db.from("cash_session").insert(sessions);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Sessions added successfully" };
};
