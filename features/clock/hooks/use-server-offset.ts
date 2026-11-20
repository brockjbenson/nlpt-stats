"use client";

import { getServerNowMs } from "@/features/clock/data/clocks";
import { serverOffsetMs } from "@/features/clock/lib/timing";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useState } from "react";

// How far this device's clock is from the database's, so every screen
// counts down from the same time. 0 until resync first answers; useClock
// calls it on every Realtime (re)subscribe and when the tab wakes up.
export function useServerOffset(): {
  offsetMs: number;
  resync: () => Promise<void>;
} {
  const [offsetMs, setOffsetMs] = useState(0);

  const resync = useCallback(async (): Promise<void> => {
    try {
      const sentAtMs = Date.now();
      const serverTimeMs = await getServerNowMs(createClient());
      const receivedAtMs = Date.now();
      setOffsetMs(serverOffsetMs({ sentAtMs, receivedAtMs, serverTimeMs }));
    } catch (error) {
      // Keep the last offset; the next resync tries again.
      console.error("Couldn't read the server time:", error);
    }
  }, []);

  return { offsetMs, resync };
}
