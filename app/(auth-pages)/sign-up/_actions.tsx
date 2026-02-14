// ============================================
// UPDATED SIGNUP ACTION WITH SERVER-SIDE VALIDATION
// app/actions.ts
// ============================================

"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type Invitation = {
  id: string;
  email: string;
  role: "admin" | "user";
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

// Password validation rules
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[^A-Za-z0-9]/,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_RULES.minLength) {
    return `Password must be at least ${PASSWORD_RULES.minLength} characters`;
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    return `Password must be less than ${PASSWORD_RULES.maxLength} characters`;
  }

  if (!PASSWORD_RULES.hasUppercase.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!PASSWORD_RULES.hasLowercase.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!PASSWORD_RULES.hasNumber.test(password)) {
    return "Password must contain at least one number";
  }

  if (!PASSWORD_RULES.hasSpecialChar.test(password)) {
    return "Password must contain at least one special character";
  }

  return null; // Valid
}

export const signUpAction = async (
  formData: FormData,
  invitation: Invitation,
) => {
  const validEmail = invitation.email;
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirm-password")?.toString();
  const supabase = await createClient();

  // Validate required fields
  if (!email || !password) {
    return encodedRedirect(
      "error",
      `/sign-up?inviteToken=${invitation.token}`,
      "Email and password are required",
    );
  }

  // Validate email matches invitation
  if (email !== validEmail) {
    return encodedRedirect(
      "error",
      `/sign-up?inviteToken=${invitation.token}`,
      "Email does not match the invitation",
    );
  }

  // Validate password strength
  const passwordError = validatePassword(password);
  if (passwordError) {
    return encodedRedirect(
      "error",
      `/sign-up?inviteToken=${invitation.token}`,
      passwordError,
    );
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      `/sign-up?inviteToken=${invitation.token}`,
      "Passwords do not match",
    );
  }

  // Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: invitation.role,
      },
    },
  });

  if (signUpError) {
    return encodedRedirect(
      "error",
      `/sign-up?inviteToken=${invitation.token}`,
      signUpError.message,
    );
  }

  // Mark invitation as accepted (done by trigger, but we can do it here too for safety)
  if (signUpData.user) {
    await supabase
      .from("invitations")
      .upsert({ accepted_at: new Date().toISOString() })
      .eq("token", invitation.token);
  }

  // Check if user needs to confirm email
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Email confirmation disabled - redirect to dashboard
    return redirect("/complete-profile?inviteToken=" + invitation.token);
  }
  // } else {
  //   // Email confirmation enabled - show message
  //   return encodedRedirect(
  //     "success",
  //     "/sign-up",
  //     "Thanks for signing up! Please check your email for a verification link.",
  //   );
  // }
};
