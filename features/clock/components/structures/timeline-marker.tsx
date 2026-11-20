import { cn } from "@/lib/utils";

// The dot and line on the left of a stop. The line runs from the previous
// stop to the next, so it starts at the first dot and ends at the last.
function TimelineMarker({
  isBreak,
  isFirst,
  isLast,
}: {
  isBreak: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="relative w-4 shrink-0" aria-hidden>
      <span
        className={cn(
          "absolute left-1/2 w-px -translate-x-1/2 bg-neutral-700",
          isFirst ? "top-4" : "top-0",
          isLast ? "h-4" : "bottom-0",
        )}
      />
      <span
        className={cn(
          "absolute left-1/2 top-[11px] -translate-x-1/2",
          isBreak
            ? "size-3 rotate-45 bg-primary"
            : "size-2.5 rounded-full border-2 border-primary bg-background",
        )}
      />
    </div>
  );
}

export default TimelineMarker;
