"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";

export const completeProfileAction = async (formData: FormData) => {
  const userId = formData.get("user-id") as string;
  const firstName = formData.get("first-name") as string;
  const lastName = formData.get("last-name") as string;
  const role = formData.get("role") as "admin" | "user";
  const email = formData.get("email") as string;

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  const supabase = await createAdminClient();

  const { error } = await supabase.from("profiles").insert({
    first_name: firstName,
    last_name: lastName,
    role: role.toLowerCase(),
    email: email,
    id: userId,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/complete-profile",
      error.message || "An error occurred while completing your profile.",
    );
  }

  return redirect("/");
};
