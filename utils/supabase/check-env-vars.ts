// This check can be removed
// it is just for tutorial purposes

export const hasEnvVars =
  process.env.DB_NEXT_PUBLIC_SUPABASE_URL &&
  process.env.DB_NEXT_PUBLIC_SUPABASE_ANON_KEY;
