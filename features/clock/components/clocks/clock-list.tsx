import { ADMIN_ACTION_CLASS } from "@/components/admin-nav/admin-action";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ClockCard from "@/features/clock/components/clocks/clock-card";
import type { ClockSummary } from "@/features/clock/data/clocks";
import { Timer } from "lucide-react";
import Link from "next/link";

const NEW_CLOCK_HREF = "/admin/clock/new";

function NewClockLink() {
  return (
    <Link className={ADMIN_ACTION_CLASS} href={NEW_CLOCK_HREF}>
      New Clock
    </Link>
  );
}

function ClockList({ clocks }: { clocks: ClockSummary[] }) {
  if (clocks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Timer />
          </EmptyMedia>
          <EmptyTitle>No Clocks</EmptyTitle>
          <EmptyDescription>
            Make a clock from a blind structure to run a tournament&rsquo;s
            levels on a TV or phone.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewClockLink />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="w-full px-2">
      <div className="mb-4 flex justify-end">
        <NewClockLink />
      </div>
      <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clocks.map((clock) => (
          <li key={clock.id}>
            <ClockCard clock={clock} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClockList;
