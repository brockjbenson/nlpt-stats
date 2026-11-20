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

const BADGE_CLASS = "rounded-full px-[0.75em] py-[0.25em] font-semibold";
const STATUS_CLASS = "uppercase tracking-wider";
// Paused stands out in red; Not started and Finished stay quiet.
const PAUSED_CLASS = "bg-red-600 text-white";
const QUIET_STATUS_CLASS = "border border-card-border text-muted";

// The status while the clock isn't running (Not started, Paused,
// Finished), and Reconnecting… while Realtime is down. The caller places
// it: the display's top-left corner, or the control card's header.
function ClockBadges({
  status,
  connection,
  size = "display",
  className,
}: {
  status: ClockStatus;
  connection: ClockConnection;
  size?: ClockFaceSize;
  className?: string;
}) {
  const showStatus = status !== "running";
  const showReconnecting = connection === "reconnecting";
  if (!showStatus && !showReconnecting) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1",
        BADGE_SIZES[size],
        className,
      )}
    >
      {showStatus && (
        <p
          className={cn(
            BADGE_CLASS,
            STATUS_CLASS,
            status === "paused" ? PAUSED_CLASS : QUIET_STATUS_CLASS,
          )}
        >
          {clockStatusLabel(status)}
        </p>
      )}
      {showReconnecting && (
        <p
          role="status"
          className={cn(BADGE_CLASS, "bg-foreground/10 text-muted")}
        >
          Reconnecting…
        </p>
      )}
    </div>
  );
}

export default ClockBadges;
