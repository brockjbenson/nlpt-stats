"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addRefusalMessage } from "@/features/clock/lib/player-messages";
import {
  GUEST_NAME_MAX_LENGTH,
  planAddEntrants,
} from "@/features/clock/lib/players";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";
import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  // The guests listed so far, trimmed.
  names: string[];
  onChange: (names: string[]) => void;
};

// Types guest names one at a time into a list of removable chips. Each name
// is checked with the same rules the save uses before it's listed.
function GuestNamesField({ clock, entrants, names, onChange }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = (): void => {
    const plan = planAddEntrants(clock, entrants, [], [...names, name]);
    if (!plan.ok) {
      setError(addRefusalMessage(plan.reason));
      return;
    }
    onChange(
      plan.value.flatMap(({ guest_name }) => (guest_name ? [guest_name] : [])),
    );
    setName("");
    setError(null);
  };

  return (
    <>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Input
          aria-label="Guest name"
          placeholder="Guest name"
          maxLength={GUEST_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" variant="outline">
          Add guest
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {names.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {names.map((guest) => (
            <li
              key={guest}
              className="flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1 text-sm"
            >
              {guest}
              <button
                type="button"
                className="rounded-full p-1 text-muted hover:text-white"
                aria-label={`Remove ${guest}`}
                onClick={() => onChange(names.filter((n) => n !== guest))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default GuestNamesField;
