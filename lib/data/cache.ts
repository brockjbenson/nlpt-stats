import { createPublicClient } from "@/utils/supabase/public";
import { PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";

// Every cached public read carries this tag. Admin saves clear it (see
// ./actions.ts), so a change shows up on the next page load.
export const LEAGUE_DATA_TAG = "league-data";

// Same shape as a Supabase response: narrowing on `error` gives `data`.
export type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

// What a query returns; annotate a query with it to give its data a type.
export type DbResponse<T> = PromiseLike<{
  data: T | null;
  error: PostgrestError | null;
}>;

// How a query is built and checked. Each query in ./league.ts is its own
// "use cache" function (a cached function can't be handed another function,
// so they can't share one wrapper), shaped like this:
//
//   export const getThing = leagueQuery(async (id: string) => {
//     "use cache";
//     leagueCache();
//     return must((db) => db.from("thing").select("*").eq("id", id));
//   });
//
// The arguments are the cache key, along with the build ID, so a new
// deployment starts with a fresh cache.

// Call first inside a cached query. Tags the entry so admin saves clear it,
// and refreshes it in the background an hour after it was fetched, which also
// picks up changes made outside the app (the Supabase dashboard).
export function leagueCache() {
  cacheTag(LEAGUE_DATA_TAG);
  cacheLife("hours");
}

// Runs a query with the cookie-free public client and throws if it fails.
// Next doesn't store a cache entry that throws, so a failed query is tried
// again on the next load.
export async function must<T>(
  run: (db: SupabaseClient) => DbResponse<T>,
): Promise<T> {
  const { data, error } = await run(createPublicClient());
  if (error) throw new Error(error.message);
  return data as T;
}

// Turns a cached query's throw back into a Supabase-style { data, error }, so
// pages handle a failure the way they always have.
export function leagueQuery<A extends unknown[], T>(
  query: (...args: A) => Promise<T>,
): (...args: A) => Promise<QueryResult<T>> {
  return async (...args: A) => {
    try {
      return { data: await query(...args), error: null };
    } catch (e) {
      // Next's own signals (redirects, deferring to request time) pass through.
      unstable_rethrow(e);
      // While a page is being prebuilt, this leaves its failed part to be
      // rendered when someone visits, so the error isn't saved into the page.
      // On a visit it returns at once.
      await connection();
      return { data: null, error: queryError(e) };
    }
  };
}

function queryError(e: unknown) {
  // In production, Next hides the message of an error thrown inside a cache
  // (the real one is in the server logs), so show a plain one instead.
  const message =
    process.env.NODE_ENV === "development" && e instanceof Error
      ? e.message
      : "Couldn't load league data. Try again in a moment";
  return new PostgrestError({ message, details: "", hint: "", code: "" });
}
