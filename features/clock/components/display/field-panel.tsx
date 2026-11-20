import type { FieldView } from "@/features/clock/lib/display";
import { cn } from "@/lib/utils";

// Text sizes that scale with the screen, like the clock face's.
const LABEL_SIZE = "text-[length:clamp(0.7rem,min(1.6vw,2.2dvh),1.25rem)]";
const VALUE_SIZE = "text-[length:clamp(1.1rem,min(3vw,4.5dvh),2.75rem)]";
const BODY_SIZE = "text-[length:clamp(0.85rem,min(1.9vw,2.8dvh),1.6rem)]";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <p
        className={cn(
          "font-semibold uppercase tracking-wider text-muted",
          LABEL_SIZE,
        )}
      >
        {label}
      </p>
      <p className={cn("font-bold tabular-nums", VALUE_SIZE)}>{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className={cn(
        "font-semibold uppercase tracking-wider text-muted",
        LABEL_SIZE,
      )}
    >
      {children}
    </p>
  );
}

type Props = {
  field: FieldView;
  // Names of the players still in, in display order.
  namesLeft: string[];
  className?: string;
};

// The display's players and money: players left (with their names),
// average stack, prize pool and each paid place's payout. Beside the clock
// in landscape, under it in portrait.
function FieldPanel({ field, namesLeft, className }: Props) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-[2dvh] rounded-xl border bg-card/60 p-[2dvh] text-center",
        className,
      )}
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Players"
          value={`${field.playersLeft}/${field.entrantCount}`}
        />
        <Stat label="Avg stack" value={field.avgStackText ?? "—"} />
        <Stat label="Pool" value={field.poolText} />
      </div>

      {namesLeft.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Still in</SectionLabel>
          {/* Wraps; in portrait it stops after a few lines and the count
              above says how many. */}
          <p className={cn("leading-snug portrait:line-clamp-3", BODY_SIZE)}>
            {namesLeft.join(" · ")}
          </p>
        </div>
      )}

      {field.payouts.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Payouts</SectionLabel>
          <ul
            className={cn(
              "grid grid-cols-2 gap-x-[1.5em] gap-y-0.5 tabular-nums portrait:grid-cols-4",
              BODY_SIZE,
            )}
          >
            {field.payouts.map(({ place, label, amountText }) => (
              <li key={place} className="flex justify-between gap-2">
                <span className="text-muted">{label}</span>
                <span className="font-semibold">{amountText}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export default FieldPanel;
