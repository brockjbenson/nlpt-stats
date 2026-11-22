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
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  changeKnockerAction,
  takeAwayRebuyAction,
} from "@/features/clock/actions/entrants";
import type { RunPlayerAction } from "@/features/clock/components/players/use-player-action";
import { plural } from "@/features/clock/lib/format";
import {
  knockerChoices,
  latestKnockouts,
  planTakeAwayRebuy,
} from "@/features/clock/lib/players";
import type {
  ClockEntrant,
  ClockKnockout,
  TournamentClock,
} from "@/features/clock/types";
import { useState } from "react";

// Select items can't have an empty value, so "not recorded" gets its own.
const NOT_RECORDED = "none";

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  knockouts: ClockKnockout[];
  // Each player's name on screen, by entrant id.
  names: Map<string, string>;
  // The player being edited; null keeps the drawer closed.
  entrantId: string | null;
  onClose: () => void;
  run: RunPlayerAction;
  isPending: boolean;
};

type FormProps = Omit<Props, "entrantId"> & { entrant: ClockEntrant };

// A player's rebuys and, for a player who is out, who knocked them out.
function EditPlayerForm({
  clock,
  entrants,
  knockouts,
  names,
  entrant,
  onClose,
  run,
  isPending,
}: FormProps) {
  const id = entrant.id;
  const currentKnocker = latestKnockouts(knockouts).get(id)?.knocked_out_by;
  const current = currentKnocker ?? NOT_RECORDED;
  const [knocker, setKnocker] = useState(current);
  // Which button was pressed, so only that one shows the spinner.
  const [pressed, setPressed] = useState<"rebuy" | "knocker" | null>(null);
  // By name, as the player list shows them.
  const choices = knockerChoices(entrants, id)
    .map((choice) => ({ id: choice.id, name: names.get(choice.id) ?? "" }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  const isOut = entrant.busted_at !== null;
  const canTakeAway = planTakeAwayRebuy(clock, entrants, id).ok;

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm">
            {entrant.rebuys > 0 ? plural(entrant.rebuys, "rebuy") : "No rebuys"}
          </p>
          {canTakeAway && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setPressed("rebuy");
                run("Couldn't take away the rebuy", () =>
                  takeAwayRebuyAction(clock.id, id),
                );
              }}
            >
              {isPending && pressed === "rebuy" ? (
                <Spinner />
              ) : (
                "Take away a rebuy"
              )}
            </Button>
          )}
        </div>
        {isOut && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-knocked-out-by">Knocked out by</Label>
            <Select value={knocker} onValueChange={setKnocker}>
              <SelectTrigger id="edit-knocked-out-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOT_RECORDED}>Not recorded</SelectItem>
                {choices.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id}>
                    {choice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DrawerFooter>
        {isOut && (
          <Button
            disabled={knocker === current || isPending}
            onClick={() => {
              setPressed("knocker");
              run(
                "Couldn't change the knockout",
                () =>
                  changeKnockerAction(
                    clock.id,
                    id,
                    knocker === NOT_RECORDED ? null : knocker,
                  ),
                onClose,
              );
            }}
          >
            {isPending && pressed === "knocker" ? <Spinner /> : "Save"}
          </Button>
        )}
        <DrawerClose asChild>
          <Button variant="outline">{isOut ? "Cancel" : "Done"}</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

// Fixes a player's rebuys (take one away) and who knocked them out.
// Reads the live player, so it updates as saves land; the parent passes a
// null id when the player is gone.
function EditPlayerDrawer({ entrantId, ...props }: Props) {
  const { entrants, knockouts, names, onClose } = props;
  const entrant = entrants.find(({ id }) => id === entrantId);
  const current = entrant
    ? (latestKnockouts(knockouts).get(entrant.id)?.knocked_out_by ??
      NOT_RECORDED)
    : NOT_RECORDED;

  return (
    <Drawer
      open={entrant !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>{entrant ? names.get(entrant.id) : ""}</DrawerTitle>
          <DrawerDescription>Fix their rebuys or knockout.</DrawerDescription>
        </DrawerHeader>
        {entrant && (
          <EditPlayerForm
            key={`${entrant.id}:${current}`}
            {...props}
            entrant={entrant}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default EditPlayerDrawer;
