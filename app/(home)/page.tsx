import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import RecentSession from "@/components/recent-session";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const db = await createClient();

  const { data: recentSessionData, error: recentSessionDataError } =
    await db.rpc("get_recent_cash_session_info");

  if (recentSessionDataError)
    return (
      <ErrorHandler
        title="Error fetching recent session data"
        errorMessage={recentSessionDataError.message}
        pageTitle="Home"
      />
    );

  return (
    <>
      <PageHeader title="Home" />
      <RecentSession data={recentSessionData} />
    </>
  );
}
