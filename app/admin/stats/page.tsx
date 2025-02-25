import { createClient } from "@/utils/supabase/server";
import React from "react";

async function StatsAdmin() {
  const db = await createClient();
  const { data: sessions, error: sessionsError } = await db
    .from("cashSession")
    .select("*")
    .eq("memberId", "12d9a4dd-1989-468b-811b-eec7664a7410");

  return <div>StatsAdmin</div>;
}

export default StatsAdmin;
