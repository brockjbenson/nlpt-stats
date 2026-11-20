"use client";

import type { ClockSound } from "@/features/clock/hooks/use-sound";
import type { TvMode } from "@/features/clock/hooks/use-tv-mode";
import { cn } from "@/lib/utils";
import { Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import type React from "react";

// Same scale as the display's badges.
export const CONTROLS_SIZE =
  "text-[length:clamp(0.75rem,min(2vw,2.5dvh),1.5rem)]";
const BUTTON_CLASS =
  "flex size-[2.4em] items-center justify-center rounded-full border border-card-border bg-card/60 text-muted transition-colors hover:text-foreground";
const ICON_CLASS = "size-[1.1em]";

function RoundButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={BUTTON_CLASS}
      aria-label={label}
      title={label}
      onClick={(event) => {
        // The page's own tap handler (unlocking sound) shouldn't also run.
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

type Props = {
  sound: ClockSound;
  tv: TvMode;
  // In TV mode with nobody using the screen: fade out.
  isHidden: boolean;
  className?: string;
};

// The right of the display's header: sound on/off, TV mode, and, to their
// left, the "Tap to enable sound" prompt while the browser is waiting for
// a tap.
function DisplayControls({ sound, tv, isHidden, className }: Props) {
  const enterTvMode = (): void => {
    tv.enter();
    sound.turnOn();
  };

  return (
    <div
      className={cn(
        "flex flex-row-reverse items-center gap-[0.5em] transition-opacity duration-500",
        CONTROLS_SIZE,
        isHidden && "pointer-events-none opacity-0",
        className,
      )}
    >
      <div className="flex gap-[0.5em]">
        {sound.isOn ? (
          <RoundButton label="Turn sound off" onClick={sound.turnOff}>
            <Volume2 className={ICON_CLASS} />
          </RoundButton>
        ) : (
          <RoundButton label="Turn sound on" onClick={sound.turnOn}>
            <VolumeX className={ICON_CLASS} />
          </RoundButton>
        )}
        {tv.isTvMode ? (
          <RoundButton label="Leave TV mode" onClick={tv.exit}>
            <Minimize className={ICON_CLASS} />
          </RoundButton>
        ) : (
          <RoundButton label="TV mode" onClick={enterTvMode}>
            <Maximize className={ICON_CLASS} />
          </RoundButton>
        )}
      </div>
      {sound.needsTap && (
        <p
          role="status"
          className="whitespace-nowrap rounded-full bg-primary px-[0.75em] py-[0.25em] font-semibold text-primary-foreground"
        >
          Tap to enable sound
        </p>
      )}
    </div>
  );
}

export default DisplayControls;
