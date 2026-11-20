"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { addEntrantsAction } from "@/features/clock/actions/entrants";
import type { MemberOption } from "@/features/clock/data/entrants";
import type { RunPlayerAction } from "@/features/clock/components/players/use-player-action";
import { plural } from "@/features/clock/lib/format";
import { addRefusalMessage } from "@/features/clock/lib/player-messages";
import {
  GUEST_NAME_MAX_LENGTH,
  planAddEntrants,
} from "@/features/clock/lib/players";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";
import { Search, UserPlus, X } from "lucide-react";
import { useState } from "react";

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  // Visible members, by name.
  members: MemberOption[];
  run: RunPlayerAction;
  isPending: boolean;
};

function matches(member: MemberOption, search: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  return `${member.first_name} ${member.last_name}`
    .toLocaleLowerCase()
    .includes(query);
}

// Picks members from a checklist and types guest names, then adds them all
// at once.
function AddPlayersDrawer({ clock, entrants, members, run, isPending }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [guestError, setGuestError] = useState<string | null>(null);

  const playing = new Set(entrants.map(({ member_id }) => member_id));
  const shown = members.filter((member) => matches(member, search));
  const count = memberIds.size + guestNames.length;

  const reset = (): void => {
    setSearch("");
    setMemberIds(new Set());
    setGuestName("");
    setGuestNames([]);
    setGuestError(null);
  };

  const toggleMember = (id: string, isChecked: boolean): void => {
    setMemberIds((current) => {
      const next = new Set(current);
      if (isChecked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Checks the name with the same rules the save uses before listing it.
  const addGuest = (): void => {
    const plan = planAddEntrants(
      clock,
      entrants,
      [],
      [...guestNames, guestName],
    );
    if (!plan.ok) {
      setGuestError(addRefusalMessage(plan.reason));
      return;
    }
    setGuestNames(
      plan.value.flatMap(({ guest_name }) => (guest_name ? [guest_name] : [])),
    );
    setGuestName("");
    setGuestError(null);
  };

  const save = (): void => {
    run(
      "Couldn't add players",
      () => addEntrantsAction(clock.id, Array.from(memberIds), guestNames),
      () => {
        setIsOpen(false);
        reset();
      },
    );
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) reset();
      }}
    >
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus size={16} /> Add
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>Add players</DrawerTitle>
          <DrawerDescription>
            Pick members and type guests&rsquo; names.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-col gap-3 px-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              aria-label="Search members"
              placeholder="Search members"
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <ul className="max-h-[40dvh] overflow-y-auto rounded-md border">
            {shown.map((member) => {
              const isPlaying = playing.has(member.id);
              const id = `add-member-${member.id}`;
              return (
                <li key={member.id} className="border-b last:border-b-0">
                  <label
                    htmlFor={id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 px-3"
                  >
                    <Checkbox
                      id={id}
                      checked={isPlaying || memberIds.has(member.id)}
                      disabled={isPlaying}
                      onCheckedChange={(checked) =>
                        toggleMember(member.id, checked === true)
                      }
                    />
                    <span className={isPlaying ? "text-muted" : undefined}>
                      {member.first_name} {member.last_name}
                    </span>
                    {isPlaying && (
                      <span className="ml-auto text-xs text-muted">
                        Playing
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted">
                No members match.
              </li>
            )}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addGuest();
            }}
          >
            <Input
              aria-label="Guest name"
              placeholder="Guest name"
              maxLength={GUEST_NAME_MAX_LENGTH}
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
            />
            <Button type="submit" variant="outline">
              Add guest
            </Button>
          </form>
          {guestError && (
            <p className="text-sm text-destructive">{guestError}</p>
          )}
          {guestNames.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {guestNames.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1 text-sm"
                >
                  {name}
                  <button
                    type="button"
                    className="rounded-full p-1 text-muted hover:text-white"
                    aria-label={`Remove ${name}`}
                    onClick={() =>
                      setGuestNames((names) => names.filter((n) => n !== name))
                    }
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DrawerFooter>
          <Button disabled={count === 0 || isPending} onClick={save}>
            {isPending ? (
              <Spinner />
            ) : count === 0 ? (
              "Add players"
            ) : (
              `Add ${plural(count, "player")}`
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default AddPlayersDrawer;
