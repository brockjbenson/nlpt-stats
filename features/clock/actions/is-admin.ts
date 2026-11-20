import { getCurrentUser } from "@/utils/supabase/user";

// Whether the signed-in user is a league admin. Every clock action checks
// this before writing, on top of RLS and the /admin route gate. A plain
// module (not "use server"), so it can't be called from the browser.
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin === true;
}
