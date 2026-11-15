import { cache } from "react";
import { createClient } from "./server";

export type CurrentUser = {
  id: string;
  email?: string;
  isAdmin: boolean;
};

// The signed-in user for this request, or null. Read from the session's
// access token with getClaims(), which verifies it locally against the
// project's asymmetric signing key (no Auth server round trip). Wrapped in
// React's cache() so every server component in one request shares a single
// lookup.
//
// Use this for UI decisions (showing admin links, sign in/out). Anything that
// must notice a session revoked server-side before its token expires should
// call supabase.auth.getUser() instead.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub,
    email: claims.email,
    isAdmin: claims.user_metadata?.role === "admin",
  };
});
