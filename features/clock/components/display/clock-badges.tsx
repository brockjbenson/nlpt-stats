import type { ClockFaceSize } from "@/features/clock/components/display/clock-face";
import type { ClockConnection } from "@/features/clock/hooks/use-clock";
import { clockStatusLabel } from "@/features/clock/lib/clocks";
import type { ClockStatus } from "@/features/clock/types";
import { cn } from "@/lib/utils";

// The display's badges scale with the screen like the rest of it.
const BADGE_SIZES: Record<ClockFaceSize, string> = {
  display: "text-[length:clamp(0.75rem,min(2vw,2.5dvh),1.5rem)]",
  compact: "text-xs",
};

const BADGE_CLASS =
  "rounded-full px-[0.75em] py-[0.25em] font-semibold text-muted";

// The top-right corner of a clock screen: the status while the clock isn't
// running (Not started, Paused, Finished), and Reconnecting… while
// Realtime is down. Goes inside a relative container.
function ClockBadges({
  status,
  connection,
  size = "display",
}: {
  status: ClockStatus;
  connection: ClockConnection;
  size?: ClockFaceSize;
}) {
  const showStatus = status !== "running";
  const showReconnecting = connection === "reconnecting";
  if (!showStatus && !showReconnecting) return null;

  return (
    <div
      className={cn(
        "absolute right-3 top-3 flex flex-col items-end gap-1",
        BADGE_SIZES[size],
      )}
    >
      {showStatus && (
        <p
          className={cn(
            BADGE_CLASS,
            "border border-card-border uppercase tracking-wider",
          )}
        >
          {clockStatusLabel(status)}
        </p>
      )}
      {showReconnecting && (
        <p role="status" className={cn(BADGE_CLASS, "bg-foreground/10")}>
          Reconnecting…
        </p>
      )}
    </div>
  );
}

export default ClockBadges;
