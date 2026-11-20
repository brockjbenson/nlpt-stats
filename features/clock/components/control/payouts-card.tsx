"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updatePayoutsAction } from "@/features/clock/actions/entrants";
import PayoutFields from "@/features/clock/components/structures/payout-fields";
import type { ClockSettings } from "@/features/clock/lib/clocks";
import { describeField, type PayoutText } from "@/features/clock/lib/display";
import { settingsReducer } from "@/features/clock/lib/structure-editor";
import { validatePayouts } from "@/features/clock/lib/structures";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { useReducer, useState, useTransition } from "react";

type Props = {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  // Shows the saved clock at once, before its Realtime event.
  applyRow: (clock: TournamentClock) => void;
};

function settingsOf(clock: TournamentClock): ClockSettings {
  return {
    name: clock.name,
    buy_in: clock.buy_in,
    rebuy: clock.rebuy,
    starting_chips: clock.starting_chips,
    rebuy_chips: clock.rebuy_chips,
    places_paid: clock.places_paid,
    payout_pcts: [...clock.payout_pcts],
    max_rebuys: clock.max_rebuys,
  };
}

// "1st $217.80", one place per line.
function PayoutList({ payouts }: { payouts: PayoutText[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
      {payouts.map(({ place, label, amountText }) => (
        <li key={place} className="flex justify-between gap-2 tabular-nums">
          <span className="text-muted">{label}</span>
          <span className="font-semibold">{amountText}</span>
        </li>
      ))}
    </ul>
  );
}

type FormProps = Props & { onSaved: () => void };

// Places paid and the split, with what they'd pay the current field.
// Mounted each time the drawer opens, so it starts from what's saved.
function EditPayoutsForm({ clock, entrants, applyRow, onSaved }: FormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [settings, dispatch] = useReducer(
    settingsReducer<ClockSettings>,
    clock,
    settingsOf,
  );
  const errors = validatePayouts(settings);
  const preview =
    errors.length === 0
      ? describeField({ ...clock, payout_pcts: settings.payout_pcts }, entrants)
      : null;

  const save = (): void => {
    startTransition(async () => {
      const result = await updatePayoutsAction(clock.id, {
        places_paid: settings.places_paid,
        payout_pcts: settings.payout_pcts,
      });
      if (result.clock) applyRow(result.clock);
      if (result.success) {
        onSaved();
        return;
      }
      toast({
        title: "Couldn't save the payouts",
        description: result.message,
        variant: "destructive",
      });
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto px-4">
        <PayoutFields
          idPrefix="clock-payouts"
          settings={settings}
          errors={errors}
          dispatch={dispatch}
        />
        {preview && preview.payouts.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              With {preview.entrantCount} players and {preview.poolText}:
            </p>
            <PayoutList payouts={preview.payouts} />
          </div>
        )}
      </div>
      <DrawerFooter>
        <Button disabled={errors.length > 0 || isPending} onClick={save}>
          {isPending ? <Spinner /> : "Save payouts"}
        </Button>
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

function EditPayoutsDrawer(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil size={14} /> Edit
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>Payouts</DrawerTitle>
          <DrawerDescription>
            Changes show on every screen when saved.
          </DrawerDescription>
        </DrawerHeader>
        {isOpen && (
          <EditPayoutsForm {...props} onSaved={() => setIsOpen(false)} />
        )}
      </DrawerContent>
    </Drawer>
  );
}

// The control screen's payouts: what each place pays now, and (until the
// clock finishes) the places paid and split to edit.
function PayoutsCard({ clock, entrants, applyRow }: Props) {
  const field = describeField(clock, entrants);
  return (
    <Card className="py-4">
      <CardHeader className="items-center justify-between gap-2">
        <CardTitle className="text-base">
          Payouts{" "}
          <span className="tabular-nums text-muted">{field.poolText}</span>
        </CardTitle>
        {clock.status !== "finished" && (
          <EditPayoutsDrawer
            clock={clock}
            entrants={entrants}
            applyRow={applyRow}
          />
        )}
      </CardHeader>
      <CardContent>
        {field.payouts.length > 0 ? (
          <PayoutList payouts={field.payouts} />
        ) : (
          <p className="text-sm text-muted">
            {clock.places_paid} places paid. Add players to see the payouts.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PayoutsCard;
