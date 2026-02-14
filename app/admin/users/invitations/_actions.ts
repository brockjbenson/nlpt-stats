"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const revokeInvitationAction = async (id: string) => {
  const db = await createClient();
  const { error } = await db.from("invitations").delete().eq("id", id);

  revalidatePath("/admin/users/invitations");
  // ✅ Return the expected format
  return { error: error?.message || null };
};

export const fetchInvitationsAction = async () => {
  const db = await createClient();
  const { data, error } = await db.from("invitations").select("*");
  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }
  return {
    data,
    error: null,
  };
};
