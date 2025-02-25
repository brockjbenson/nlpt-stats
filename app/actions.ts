"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const addMemberAction = async (formData: FormData) => {
  const supabase = await createClient();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const nickname = formData.get("nickname")?.toString();
  const portraitUrl = formData.get("portraitUrl")?.toString();

  if (!firstName || !lastName) {
    return encodedRedirect(
      "error",
      "/admin/members/add",
      "First name and last name are required"
    );
  }

  const { error } = await supabase.from("members").insert([
    {
      firstName,
      lastName,
      nickname,
      portraitUrl,
    },
  ]);

  if (error) {
    return encodedRedirect("error", "/admin/members/add", error.message);
  }

  return redirect("/admin/members");
};

export const editMemberAction = async (formData: FormData) => {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const firstName = formData.get("firstName")
    ? (formData.get("firstName") as string)
    : (formData.get("filledFistName") as string);
  const lastName = formData.get("lastName")
    ? (formData.get("lastName") as string)
    : (formData.get("filledLastName") as string);
  const nickname = formData.get("nickname")
    ? formData.get("nickname")?.toString()
    : formData.get("filledNickname")?.toString();
  const portraitUrl = formData.get("portraitUrl")
    ? formData.get("portraitUrl")?.toString()
    : formData.get("filledPortraitUrl")?.toString();

  if (!firstName || !lastName) {
    return encodedRedirect(
      "error",
      `/admin/members/edit/${id}`,
      "First name and last name are required"
    );
  }

  const { error } = await supabase
    .from("members")
    .update({ firstName, lastName, nickname, portraitUrl })
    .eq("id", id);

  if (error) {
    return encodedRedirect("error", `/admin/members/edit/${id}`, error.message);
  }

  return encodedRedirect(
    "success",
    `/admin/members`,
    "Member updated successfully"
  );
};

export const addWeeksAction = async (formData: FormData) => {
  const supabase = await createClient();
  const year = formData.get("year") as string;
  const season_id = formData.get("seasonId") as string;
  const weeksNumber = formData.get("weeks") as string;

  if (!season_id || !weeksNumber) {
    return encodedRedirect(
      "error",
      `/admin/seasons?year=${year}&newweek=${season_id}`,
      "Season ID and number of weeks are required"
    );
  }

  const { data: existingWeeks, error: fetchError } = await supabase
    .from("week")
    .select("week_number")
    .eq("season_id", season_id)
    .order("week_number", { ascending: false })
    .limit(1);

  if (fetchError) {
    return encodedRedirect(
      "error",
      `/admin/seasons?year=${year}&newweek=${season_id}`,
      `Failed to fetch existing weeks: ${fetchError.message}`
    );
  }

  const lastWeekNumber = existingWeeks?.[0]?.week_number || 0;

  const newWeeks = Array.from({ length: Number(weeksNumber) }, (_, i) => ({
    season_id,
    week_number: lastWeekNumber + i + 1,
  }));

  const { error: insertError } = await supabase.from("week").insert(newWeeks);

  if (insertError) {
    return encodedRedirect(
      "error",
      `/admin/seasons?year=${year}&newweek=${season_id}`,
      insertError.message
    );
  }

  return redirect(`/admin/seasons?year=${year}`);
};
