import { Badge } from "@/components/ui/badge";
import { ordinal, plural } from "@/features/clock/lib/format";
import type { PlayerRow as PlayerRowData } from "@/features/clock/lib/players";
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

  const info = (
    <>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="truncate">{name}</span>
        {isGuest && (
          <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-xs">
            Guest
          </Badge>
        )}
        {knockouts > 0 && (
          <Badge
            variant="secondary"
            className="shrink-0 px-1.5 py-0 text-xs tabular-nums"
            title={`${plural(knockouts, "knockout")}`}
          >
            {knockouts} KO
          </Badge>
        )}
      </div>
      {details.length > 0 && (
        <p className="truncate text-xs text-muted">{details.join(" · ")}</p>
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
          aria-label={`Edit ${name}`}
          onClick={onEdit}
          className="min-w-0 flex-1 rounded-sm text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
