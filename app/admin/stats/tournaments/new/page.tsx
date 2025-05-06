import { createClient } from "@/utils/supabase/server";
import React from "react";
import NewTournamentForm from "./_components/newTournamentForm";

async function Page() {
  const db = await createClient();
  const [
    { data: members, error: memberError },
    { data: seasons, error: seasonError },
  ] = await Promise.all([
    db.from("members").select("*"),
    db.from("season").select("*"),
  ]);

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }
  return (
    <>
      <h2 className="text-center w-full mb-6">Add New Tournament</h2>
      <NewTournamentForm seasons={seasons} members={members} />
    </>
  );
}

export default Page;
