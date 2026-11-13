import { BottomTabAccessory } from "@/components/bottom-tabs/accessory";
import { CashSession } from "@/utils/types";
import React from "react";

// The Add Sessions action as the page's bottom tab accessory: the whole
// capsule is the button. Above the tab bar while it's expanded, beside the
// small capsule when it's minimized. (The running difference is in the page
// header; see header-balance.tsx.)
export default function FloatingAddButton({
  sessions,
  onClick,
  show,
}: {
  sessions: Omit<CashSession, "id">[];
  onClick: () => void;
  show: boolean;
}) {
  if (!show) return null;

  const count = sessions.length;

  return (
    // Border matches the button. Pressing (or hovering with a mouse) dims the
    // whole capsule, so button and border stay the same color.
    <BottomTabAccessory className="border-primary transition-[filter] duration-150 has-[button:active]:brightness-90 [@media(hover:hover)]:has-[button:hover]:brightness-95">
      <button
        type="button"
        onClick={onClick}
        className="bg-primary flex size-full items-center justify-center text-sm font-semibold text-white"
      >
        Add {count} {count === 1 ? "Session" : "Sessions"}
      </button>
    </BottomTabAccessory>
  );
}
