import { createClient } from "@supabase/supabase-js";

// Cookie-free client for public league data. The stats tables and functions
// are readable by anyone (RLS "read access for all users"), so cached reads
// use this instead of the request's session client: a cached function can't
// read request cookies, and its result mustn't depend on who is signed in.
export const createPublicClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
