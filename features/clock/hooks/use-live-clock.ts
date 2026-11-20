"use client";

import { getLiveClocks } from "@/features/clock/data/clocks";
import { useOnVisible } from "@/features/clock/hooks/use-on-visible";
import { pickLiveClock } from "@/features/clock/lib/live";
import type { TournamentClock } from "@/features/clock/types";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

const CLOCKS_TABLE = "_tournament_clocks";
// After a change arrives, the live clocks are fetched again this long after
// the last one. Starting, pausing, finishing or deleting any clock can add
// or remove one, so the whole (short) list is fetched rather than merging
// rows; a burst of control presses becomes one fetch.
const REFETCH_DELAY_MS = 1000;

// Calls onChange for every insert, update or delete of any clock, and
// onSubscribed each time the channel is (re)subscribed. Returns the
// unsubscribe.
function subscribeToClocks(
  onChange: () => void,
  onSubscribed: () => void,
): () => void {
  const db = createClient();
  const channel = db
    .channel("live-clocks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: CLOCKS_TABLE },
      onChange,
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") onSubscribed();
    });

  return () => {
    void db.removeChannel(channel);
  };
}

// The clock a "Tournament live" banner shows, kept current over Realtime:
// null until it's known one is running or paused, and again once none is.
// Missed changes (Realtime doesn't replay them) are fetched again on every
// (re)subscribe and when the tab becomes visible.
export function useLiveClock(): TournamentClock | null {
  const [clocks, setClocks] = useState<TournamentClock[]>([]);

  const refetch = useCallback((): void => {
    void getLiveClocks(createClient()).then(setClocks);
  }, []);

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchSoon = useCallback((): void => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(refetch, REFETCH_DELAY_MS);
  }, [refetch]);

  // Set up and torn down entirely here: a hidden layout (React <Activity>)
  // runs this cleanup and subscribes again when it's shown.
  useEffect(() => {
    // Load at once rather than waiting for Realtime, which may be slow to
    // connect (or never connect, on a network that blocks websockets).
    refetch();
    const unsubscribe = subscribeToClocks(refetchSoon, refetch);
    return () => {
      unsubscribe();
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
  }, [refetch, refetchSoon]);
  useOnVisible(refetch);

  return pickLiveClock(clocks);
}
