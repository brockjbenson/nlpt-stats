import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import RecentSession from "@/components/recent-session";
import { getRecentCashSessionInfo } from "@/lib/data/league";

export default async function Home() {
  const { data: recentSessionData, error: recentSessionDataError } =
    await getRecentCashSessionInfo();

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
