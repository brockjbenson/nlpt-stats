import { createClient } from "@/utils/supabase/server";
import React from "react";
import CompleteProfileForm from "./_components/form";
import { redirect } from "next/navigation";
import { Message } from "@/components/form-message";

async function page({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_description?: string;
  }>;
}) {
  const db = await createClient();

  const { error, error_description } = await searchParams;

  const message: Message | undefined = error
    ? { error: error_description || error }
    : undefined;

  const { data: user } = await db.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  if (!user?.user?.email) {
    return redirect("/sign-in");
  }

  const userRole = user?.user?.user_metadata.role;
  const userId = user?.user?.id;
  const email = user?.user?.email || "";

  return (
    <CompleteProfileForm
      role={userRole}
      email={email}
      message={message}
      userId={userId}
    />
  );
}

export default page;
