"use client";

import { createClient } from "@/utils/supabase/client";
import { CashSession } from "@/utils/types";

export const editSessionAction = async (
  sessions: CashSession[],
  sessionsToDelete: CashSession[]
) => {
  const db = createClient();

  const deletePromises = sessionsToDelete.map((session) =>
    db.from("cash_session").delete().eq("id", session.id)
  );

  // Create an array of update promises
  const updatePromises = sessions.map((session) =>
    db
      .from("cash_session")
      .update({
        buy_in: session.buy_in,
        cash_out: session.cash_out,
        net_profit: session.net_profit,
        nlpi_points: session.nlpi_points,
        poy_points: session.poy_points,
        rebuys: session.rebuys,
      })
      .eq("id", session.id)
  );

  // Combine both operations into a single Promise.all()
  const results = await Promise.all([...deletePromises, ...updatePromises]);

  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    console.error("Some updates failed:", errors);
    return { success: false, message: errors };
  }

  return { success: true, message: "Sessions added successfully" };
};
