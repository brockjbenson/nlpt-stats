"use client";

import {
  type ClockRow,
  getClock,
  mergeClockRow,
} from "@/features/clock/data/clocks";
import { useServerOffset } from "@/features/clock/hooks/use-server-offset";
import { applyUpdate } from "@/features/clock/lib/controls";
import { type ClockView, describeClock } from "@/features/clock/lib/display";
import type { ClockUpdate } from "@/features/clock/lib/timing";
import type { TournamentClock } from "@/features/clock/types";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useOptimistic, useState } from "react";

// How often the countdown redraws. Under a second, so the seconds tick
// over close to when they really change.
const TICK_MS = 250;
const CLOCKS_TABLE = "_tournament_clocks";

export type ClockConnection = "live" | "reconnecting";

export type LiveClock = {
  // The clock as shown: the latest saved row, with any control still being
  // saved already applied.
  clock: TournamentClock;
  view: ClockView;
  nowMs: number;
  connection: ClockConnection;
  // The clock was deleted while this screen had it open.
  isDeleted: boolean;
  // Shows a row a control action returned, before its Realtime event.
  applyRow: (clock: TournamentClock) => void;
  // Shows a control's planned columns at once, until its action finishes:
  // then the saved row shows, or the clock goes back if it was refused.
  // Call inside a transition.
  showUpdate: (update: ClockUpdate) => void;
};

// The current time on the database's clock, redrawn every tick. Starts
// from the time the page was rendered with, so the first paint matches
// the server's HTML.
function useServerNow(initialNowMs: number, offsetMs: number): number {
  const [nowMs, setNowMs] = useState(initialNowMs);
  useEffect(() => {
    const tick = (): void => setNowMs(Date.now() + offsetMs);
    tick();
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [offsetMs]);
  return nowMs;
}

// A clock kept live: Realtime updates, the server time offset, and a
// countdown worked out locally every tick. Missed updates (Realtime
// doesn't replay them) are fetched again on every (re)subscribe and when
// the tab becomes visible, so a phone that slept catches up at once.
export function useClock(
  initialClock: TournamentClock,
  initialNowMs: number,
): LiveClock {
  const clockId = initialClock.id;
  const [clock, setClock] = useState(initialClock);
  const [shownClock, showUpdate] = useOptimistic(clock, applyUpdate);
  const [isDeleted, setIsDeleted] = useState(false);
  const [connection, setConnection] = useState<ClockConnection>("live");
  const { offsetMs, resync } = useServerOffset();
  const nowMs = useServerNow(initialNowMs, offsetMs);

  const refetch = useCallback(async (): Promise<void> => {
    const { data, error } = await getClock(createClient(), clockId);
    if (error) return;
    if (data) setClock(data);
    else setIsDeleted(true);
  }, [clockId]);

  useEffect(() => {
    const db = createClient();
    const filter = `id=eq.${clockId}`;
    const channel = db
      .channel(`clock-${clockId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: CLOCKS_TABLE, filter },
        (payload) =>
          setClock((current) =>
            mergeClockRow(current, payload.new as Partial<ClockRow>),
          ),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: CLOCKS_TABLE, filter },
        // Realtime doesn't filter deletes, so check it's this clock.
        (payload) => {
          if ((payload.old as { id?: string }).id === clockId) {
            setIsDeleted(true);
          }
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setConnection("reconnecting");
          return;
        }
        setConnection("live");
        void refetch();
        void resync();
      });

    return () => {
      void db.removeChannel(channel);
    };
  }, [clockId, refetch, resync]);

  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState !== "visible") return;
      void refetch();
      void resync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch, resync]);

  return {
    clock: shownClock,
    view: describeClock(shownClock, nowMs),
    nowMs,
    connection,
    isDeleted,
    applyRow: setClock,
    showUpdate,
  };
}
