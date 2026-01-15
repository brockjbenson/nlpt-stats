import Seasons from "@/features/admin/components/seasons/seasons";
import ErrorHandler from "@/components/error-handler";
import { createClient } from "@/utils/supabase/server";

export interface SeasonWithWeeks {
  id: string;
  year: number;
  week: Array<{
    id: string;
    week_number: number;
  }>;
  cash_session: Array<{
    id: string;
    buy_in: number;
  }>;
}

async function Page() {
  const db = await createClient();
  const { data, error } = await db
    .from("season")
    .select(
      `
      *,
      week(*),
      cash_session(id, buy_in)
    `
    )
    .order("year", { ascending: false });

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={error.message}
        pageTitle="Seasons"
      />
    );
  }

  const seasons = (data ?? []) as SeasonWithWeeks[];
  return <Seasons seasons={seasons} />;
}

export default Page;
