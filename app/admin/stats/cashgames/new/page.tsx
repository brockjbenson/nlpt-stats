import AddCashSessions from "@/components/admin/stats/add-cash-sessions";
import { createClient } from "@/utils/supabase/server";

async function NewCashGame() {
  const db = await createClient();
  const { data: members, error: membersError } = await db
    .from("members")
    .select("*")
    .order("firstName", { ascending: true });
  if (membersError) {
    return <p>Error fetching Members data: {membersError.message}</p>;
  }
  const { data: seasons, error: seasonsError } = await db
    .from("season")
    .select("*")
    .order("year", { ascending: false });

  if (seasonsError) {
    return <p>Error fetching Seasons data: {seasonsError.message}</p>;
  }
  const { data: weeks, error: weeksError } = await db.from("week").select("*");

  if (weeksError) {
    return <p>Error fetching Weeks data: {weeksError.message}</p>;
  }

  return (
    <>
      <AddCashSessions members={members} seasons={seasons} weeks={weeks} />
    </>
  );
}

export default NewCashGame;
