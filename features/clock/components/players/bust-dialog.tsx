"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ordinal } from "@/features/clock/lib/format";
import type { PlayerRow } from "@/features/clock/lib/players";
import { useState } from "react";

// Select items can't have an empty value, so "not recorded" gets its own.
const NOT_RECORDED = "none";

type Props = {
  // The player being busted; null keeps the dialog closed.
  player: PlayerRow | null;
  // Everyone still in, including the player being busted.
  playersIn: PlayerRow[];
  isPending: boolean;
  onBust: (knockedOutBy: string | null) => void;
  onClose: () => void;
};

// Confirms a bust, with the place it gives and who knocked the player out.
// Render it with key={the player's id} so the choice starts fresh for each
// player.
function BustDialog({ player, playersIn, isPending, onBust, onClose }: Props) {
  const [knockedOutBy, setKnockedOutBy] = useState(NOT_RECORDED);
  const others = playersIn.filter(
    ({ entrant }) => entrant.id !== player?.entrant.id,
  );

  return (
    <AlertDialog
      open={player !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bust {player?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They finish {ordinal(playersIn.length)}. You can undo this until the
            next bust.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="knocked-out-by">Knocked out by</Label>
          <Select value={knockedOutBy} onValueChange={setKnockedOutBy}>
            <SelectTrigger id="knocked-out-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOT_RECORDED}>Not recorded</SelectItem>
              {others.map(({ entrant, name }) => (
                <SelectItem key={entrant.id} value={entrant.id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-red-600 text-destructive-foreground hover:bg-red-600/90"
            onClick={(event) => {
              // Keep the dialog open until the bust is saved.
              event.preventDefault();
              onBust(knockedOutBy === NOT_RECORDED ? null : knockedOutBy);
            }}
          >
            {isPending ? <Spinner /> : "Bust"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default BustDialog;
