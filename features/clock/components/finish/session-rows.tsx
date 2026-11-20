"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import { formatDollars, ordinal } from "@/features/clock/lib/format";
import type {
  FinishFormError,
  FinishGuest,
  FinishSessionRow,
} from "@/features/clock/lib/finish-form";

type Props = {
  sessions: FinishSessionRow[];
  guests: FinishGuest[];
  errors: FinishFormError[];
  onChange: (index: number, change: Partial<FinishSessionRow>) => void;
};

// The members' sessions, in saved place order (re-ranked among members),
// with rebuys and cash-out editable; then the guests, who aren't saved.
function SessionRows({ sessions, guests, errors, onChange }: Props) {
  const sessionErrors = errors.filter(({ field }) => field === "sessions");
  const rowErrors = (index: number): FinishFormError[] =>
    sessionErrors.filter((error) => error.index === index);

  return (
    <Card className="gap-2 py-4">
      <CardHeader>
        <CardTitle className="text-base">Members</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-[2.5rem_1fr_4.5rem_6rem] items-center gap-x-2 text-xs text-muted">
          <span>Place</span>
          <span>Member</span>
          <span>Rebuys</span>
          <span>Cash-out ($)</span>
        </div>
        <ul className="flex flex-col divide-y">
          {sessions.map((session, index) => (
            <li key={session.member_id} className="flex flex-col gap-1 py-1.5">
              <div className="grid grid-cols-[2.5rem_1fr_4.5rem_6rem] items-center gap-x-2">
                <span className="text-sm font-semibold tabular-nums text-muted">
                  {ordinal(session.place)}
                </span>
                <span className="truncate font-medium">{session.name}</span>
                <NumberInput
                  aria-label={`${session.name} rebuys`}
                  min={0}
                  step={1}
                  value={session.rebuys}
                  onValueChange={(rebuys) => onChange(index, { rebuys })}
                />
                <NumberInput
                  aria-label={`${session.name} cash-out`}
                  min={0}
                  step={0.01}
                  value={session.cash_out}
                  onValueChange={(cash_out) => onChange(index, { cash_out })}
                />
              </div>
              <ErrorText errors={rowErrors(index)} />
            </li>
          ))}
        </ul>
        <ErrorText
          errors={sessionErrors.filter(({ index }) => index === undefined)}
        />

        {guests.length > 0 && (
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Guests · not saved (guests have no stats)
            </p>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {guests.map((guest) => (
                <li
                  key={`${guest.place}-${guest.name}`}
                  className="grid grid-cols-[2.5rem_1fr_auto] gap-x-2 tabular-nums"
                >
                  <span>{ordinal(guest.place)}</span>
                  <span className="truncate">{guest.name}</span>
                  <span>{formatDollars(guest.cash_out)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SessionRows;
