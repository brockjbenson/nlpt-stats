import RecentSession from "@/components/recent-session";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const currentYear = new Date().getFullYear();
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", currentYear);
  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, member:member_id(*), week:week_id(*)`)
    .eq("season_id", season[0].id)
    .order("created_at", { ascending: false })
    .limit(16);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  return (
    <>
      <h2>Most Recent Session</h2>
      <RecentSession sessions={sessions} year={currentYear} />
    </>
  );
}
