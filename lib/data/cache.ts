import { createPublicClient } from "@/utils/supabase/public";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Every cached public read carries this tag. Admin saves clear it (see
// ./actions.ts), so a change shows up on the next page load.
export const LEAGUE_DATA_TAG = "league-data";

// Fallback for changes made outside the app (the Supabase dashboard, another
// client): cached data is refreshed at most this long after it was fetched.
const FALLBACK_REVALIDATE_SECONDS = 60 * 60;

// A new deployment starts with a fresh cache, so a change in a query's shape
// never meets data cached by the previous version.
const DEPLOYMENT = process.env.VERCEL_DEPLOYMENT_ID ?? "local";

// Same shape as a Supabase response: narrowing on `error` gives `data`.
export type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

// What a query returns; annotate a query with it to give its data a type.
export type DbResponse<T> = PromiseLike<{
  data: T | null;
  error: PostgrestError | null;
}>;

class QueryFailed extends Error {
  constructor(readonly error: PostgrestError) {
    super(error.message);
  }
}

// Wraps one public query in Next's data cache under LEAGUE_DATA_TAG. `key`
// must be unique per query; the arguments are part of the cache key. A failed
// query is returned for this request only, never cached, so it's retried on
// the next load.
export function cachedQuery<A extends unknown[], T>(
  key: string,
  run: (db: SupabaseClient, ...args: A) => DbResponse<T>,
): (...args: A) => Promise<QueryResult<T>> {
  const cached = unstable_cache(
    async (...args: A): Promise<T> => {
      const { data, error } = await run(createPublicClient(), ...args);
      if (error) throw new QueryFailed(error);
      return data as T;
    },
    [LEAGUE_DATA_TAG, key, run.toString(), DEPLOYMENT],
    { tags: [LEAGUE_DATA_TAG], revalidate: FALLBACK_REVALIDATE_SECONDS },
  );

  return async (...args: A) => {
    try {
      return { data: await cached(...args), error: null };
    } catch (e) {
      if (e instanceof QueryFailed) return { data: null, error: e.error };
      throw e;
    }
  };
}
