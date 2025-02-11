import PageHeader from "@/components/page-header/page-header";
import RecentSession from "@/components/recent-session";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const currentYear = new Date().getFullYear();
  const db = await createClient();

  // Fetch season and sessions in parallel to reduce load time
  const [{ data: sessions, error: sessionError }] = await Promise.all([
    db
      .from("cash_session")
      .select(
        `
        *,
        member:member_id(id, first_name),
        week:week_id(id, week_number)
      `
      )
      .order("created_at", { ascending: false })
      .limit(16),
  ]);

  if (sessionError)
    return <p>Error fetching Session data: {sessionError.message}</p>;

  return (
    <>
      <PageHeader title="Home" />
      <RecentSession sessions={sessions} year={currentYear} />
    </>
  );
}
