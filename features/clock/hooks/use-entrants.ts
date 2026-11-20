"use client";

import {
  applyRowChange,
  type ClockPlayers,
  getClockPlayers,
  type RowChange,
} from "@/features/clock/data/entrants";
import { useOnVisible } from "@/features/clock/hooks/use-on-visible";
import type { ClockEntrant, ClockKnockout } from "@/features/clock/types";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

const ENTRANTS_TABLE = "_clock_entrants";
const KNOCKOUTS_TABLE = "_clock_knockouts";
// After a change arrives, both lists are fetched again this long after the
// last one. Realtime can drop an event (seen on dev just after
// subscribing), and a bust or undo always changes both tables, so this
// heals a missed event within a moment. The lists are small.
const RESYNC_DELAY_MS = 1000;

export type LivePlayers = ClockPlayers & {
  // Shows the lists a player action returned, before its Realtime events.
  applyResult: (result: Partial<ClockPlayers>) => void;
};

type PlayersChannelHandlers = {
  onEntrant: (change: RowChange<ClockEntrant>) => void;
  onKnockout: (change: RowChange<ClockKnockout>) => void;
  // Called each time the channel is (re)subscribed.
  onSubscribed: () => void;
};

// Listens for every change to one clock's players and knockouts. Returns
// the unsubscribe.
function subscribeToPlayers(
  clockId: string,
  handlers: PlayersChannelHandlers,
): () => void {
  const db = createClient();
  const filter = `clock_id=eq.${clockId}`;
  const channel = db
    .channel(`clock-players-${clockId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: ENTRANTS_TABLE, filter },
      (payload) => handlers.onEntrant(payload as RowChange<ClockEntrant>),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: KNOCKOUTS_TABLE, filter },
      (payload) => handlers.onKnockout(payload as RowChange<ClockKnockout>),
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") handlers.onSubscribed();
    });

  return () => {
    void db.removeChannel(channel);
  };
}

// A clock's players and knockouts kept live over Realtime. Missed changes
// (Realtime doesn't replay them) are fetched again on every (re)subscribe
// and when the tab becomes visible. useClock shows the connection state.
export function useEntrants(
  clockId: string,
  initial: ClockPlayers,
): LivePlayers {
  const [entrants, setEntrants] = useState(initial.entrants);
  const [knockouts, setKnockouts] = useState(initial.knockouts);

  const refetch = useCallback((): void => {
    void getClockPlayers(createClient(), clockId).then(({ data }) => {
      if (!data) return;
      setEntrants(data.entrants);
      setKnockouts(data.knockouts);
    });
  }, [clockId]);

  // Fetches both lists again once changes stop arriving for a moment.
  const resyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resyncSoon = useCallback((): void => {
    if (resyncTimer.current) clearTimeout(resyncTimer.current);
    resyncTimer.current = setTimeout(refetch, RESYNC_DELAY_MS);
  }, [refetch]);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers(clockId, {
      onEntrant: (change) => {
        setEntrants((rows) => applyRowChange(rows, change, clockId));
        resyncSoon();
      },
      onKnockout: (change) => {
        setKnockouts((rows) => applyRowChange(rows, change, clockId));
        resyncSoon();
      },
      onSubscribed: refetch,
    });
    return () => {
      unsubscribe();
      if (resyncTimer.current) clearTimeout(resyncTimer.current);
    };
  }, [clockId, refetch, resyncSoon]);
  useOnVisible(refetch);

  const applyResult = useCallback((result: Partial<ClockPlayers>): void => {
    if (result.entrants) setEntrants(result.entrants);
    if (result.knockouts) setKnockouts(result.knockouts);
  }, []);

  return { entrants, knockouts, applyResult };
}
