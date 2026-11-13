import PageHeader from "@/components/page-header/page-header";
import AddCashSessions from "@/features/admin/components/cash/new-session/add-sessions";
import { CASH_BALANCE_SLOT_ID } from "@/features/admin/components/cash/new-session/session-balance-tracker";
import { createClient } from "@/utils/supabase/server";

async function page() {
  const db = await createClient();
  const { data: members, error: membersError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true })
    .eq("visible", true);
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
      <PageHeader title="New Cash Session">
        {/* Bottom row of the header (like the stats page tabs), filled in by
            AddCashSessions with buy-ins, cash-outs and the difference. Hidden
            while empty so the header doesn't grow until there are sessions. */}
        <div
          id={CASH_BALANCE_SLOT_ID}
          className="col-span-3 col-start-1 row-start-2 w-full empty:hidden"
        />
      </PageHeader>
      <AddCashSessions members={members} seasons={seasons} weeks={weeks} />
    </>
  );
}

export default page;
