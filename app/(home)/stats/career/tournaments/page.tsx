import { createClient } from "@/utils/supabase/server";
import React from "react";

async function Page() {
  const db = await createClient();
  return (
    <>
      <h1>Career Tournament Stats</h1>
    </>
  );
}

export default Page;
