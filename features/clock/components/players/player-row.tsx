import { badgeVariants } from "@/components/ui/badge";
import { ordinal, plural } from "@/features/clock/lib/format";
import type { PlayerRow as PlayerRowData } from "@/features/clock/lib/players";
import { cn } from "@/lib/utils";
import type React from "react";

type Props = {
  player: PlayerRowData;
  // "KO by Alex S." on a player who is out, when it was recorded.
  knockedOutBy?: string | null;
  // Makes the name area a button that opens the player's editor.
  onEdit?: () => void;
  // The row's buttons, at the right.
  children?: React.ReactNode;
};

// One player: their place when out, name, rebuys and knockouts, and the
// buttons that apply to them.
function PlayerRow({ player, knockedOutBy, onEdit, children }: Props) {
  const { entrant, name, isGuest, knockouts } = player;
  const details = [
    entrant.rebuys > 0 ? plural(entrant.rebuys, "rebuy") : null,
    knockedOutBy ? `KO by ${knockedOutBy}` : null,
  ].filter(Boolean);

  // Spans only, so it is valid inside the edit button.
  const info = (
    <>
      <span className="flex items-center gap-1.5 font-medium">
        {onEdit && <span className="sr-only">Edit </span>}
        <span className="truncate">{name}</span>
        {isGuest && (
          <span
            className={cn(
              badgeVariants({ variant: "outline" }),
              "shrink-0 px-1.5 py-0 text-xs",
            )}
          >
            Guest
          </span>
        )}
        {knockouts > 0 && (
          <span
            className={cn(
              badgeVariants({ variant: "secondary" }),
              "shrink-0 px-1.5 py-0 text-xs tabular-nums",
            )}
            title={`${plural(knockouts, "knockout")}`}
          >
            {knockouts} KO
          </span>
        )}
      </span>
      {details.length > 0 && (
        <span className="block truncate text-xs text-muted">
          {details.join(" · ")}
        </span>
      )}
    </>
  );

  return (
    <li className="flex min-h-12 items-center gap-2 py-1.5">
      {entrant.finish_place !== null && (
        <span className="w-9 shrink-0 text-sm font-semibold tabular-nums text-muted">
          {ordinal(entrant.finish_place)}
        </span>
      )}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 flex-col justify-center self-stretch rounded-sm text-left hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {info}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{info}</div>
      )}
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </li>
  );
}

export default PlayerRow;
