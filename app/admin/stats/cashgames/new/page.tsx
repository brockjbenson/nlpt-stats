import AddCashSessions from "@/components/admin/stats/add-cash-sessions";
import { createClient } from "@/utils/supabase/server";

async function NewCashGame() {
  const db = await createClient();
  const { data: members, error: membersError } = await db
    .from("members")
    .select("*");
  const { data: seasons, error: seasonsError } = await db
    .from("season")
    .select("*");
  const { data: weeks, error: weeksError } = await db.from("week").select("*");

  return (
    <div>
      <h2>Add new cash sessions</h2>
      <AddCashSessions members={members} seasons={seasons} weeks={weeks} />
    </div>
  );
}

export default NewCashGame;
