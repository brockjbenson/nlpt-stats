"use client";

import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { addEntrantsAction } from "@/features/clock/actions/entrants";
import type { MemberOption } from "@/features/clock/data/entrants";
import GuestNamesField from "@/features/clock/components/players/guest-names-field";
import MemberChecklist from "@/features/clock/components/players/member-checklist";
import type { RunPlayerAction } from "@/features/clock/components/players/use-player-action";
import { plural } from "@/features/clock/lib/format";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";
import { UserPlus } from "lucide-react";
import { useState } from "react";

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  // Visible members, by name.
  members: MemberOption[];
  run: RunPlayerAction;
  isPending: boolean;
};

// The members ticked and guests typed so far, and the button that adds
// them. Mounted each time the drawer opens, so it starts empty.
function AddPlayersForm({
  clock,
  entrants,
  members,
  run,
  isPending,
  onAdded,
}: Props & { onAdded: () => void }) {
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const count = memberIds.size + guestNames.length;

  const toggleMember = (id: string, isChecked: boolean): void => {
    setMemberIds((current) => {
      const next = new Set(current);
      if (isChecked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const save = (): void => {
    run(
      "Couldn't add players",
      () => addEntrantsAction(clock.id, Array.from(memberIds), guestNames),
      onAdded,
    );
  };

  return (
    <>
      <div className="flex min-h-0 flex-col gap-3 px-4">
        <MemberChecklist
          members={members}
          playingIds={new Set(entrants.map(({ member_id }) => member_id))}
          selectedIds={memberIds}
          onToggle={toggleMember}
        />
        <GuestNamesField
          clock={clock}
          entrants={entrants}
          names={guestNames}
          onChange={setGuestNames}
        />
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
    </>
  );
}

// Picks members from a checklist and types guest names, then adds them all
// at once.
function AddPlayersDrawer(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
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
        {isOpen && (
          <AddPlayersForm {...props} onAdded={() => setIsOpen(false)} />
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default AddPlayersDrawer;
