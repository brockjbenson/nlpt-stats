"use client";

import ClockBadges from "@/features/clock/components/display/clock-badges";
import DisplayControls, {
  CONTROLS_SIZE,
} from "@/features/clock/components/display/display-controls";
import type { ClockConnection } from "@/features/clock/hooks/use-clock";
import type { ClockSound } from "@/features/clock/hooks/use-sound";
import type { TvMode } from "@/features/clock/hooks/use-tv-mode";
import type { ClockStatus } from "@/features/clock/types";
import { cn } from "@/lib/utils";

// The header's height (below the safe area), in the controls' scaled text
// size: a round button (2.4em) with 0.75em above and below. The spacer
// under the header uses the same 3.9em.
const HEADER_HEIGHT = "h-[3.9em]";

type Props = {
  status: ClockStatus;
  connection: ClockConnection;
  sound: ClockSound;
  tv: TvMode;
  // In TV mode with nobody using the screen: the controls fade out.
  isIdle: boolean;
};

// The display's header: the status badges, and the sound and TV mode
// controls. Solid and fixed to the top like the app's other
// page headers, so iOS 26 colors the status bar area from it instead of
// showing its soft blur there. No bottom border: it blends into the page.
function DisplayHeader({ status, connection, sound, tv, isIdle }: Props) {
  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-background px-3 pt-[env(safe-area-inset-top)]",
          CONTROLS_SIZE,
        )}
      >
        <div className={cn("flex items-center", HEADER_HEIGHT)}>
          <ClockBadges
            status={status}
            connection={connection}
            className="flex-row items-center"
          />
        </div>
        <DisplayControls sound={sound} tv={tv} isHidden={isIdle} />
      </header>
      {/* Holds the header's space in the page, which scrolls under it. */}
      <div
        aria-hidden
        className={cn(
          "h-[calc(3.9em+env(safe-area-inset-top))] shrink-0",
          CONTROLS_SIZE,
        )}
      />
    </>
  );
}

export default DisplayHeader;
