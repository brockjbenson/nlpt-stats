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
import {
  type ClockSettingsActionResult,
  updateClockSettingsAction,
} from "@/features/clock/actions/clocks";
import SettingsFields from "@/features/clock/components/structures/settings-fields";
import { useActionWithToast } from "@/features/clock/hooks/use-action-with-toast";
import {
  type ClockDetails,
  type ClockSettings,
  clockSettingsOf,
  validateClockDetails,
} from "@/features/clock/lib/clocks";
import {
  formatChips,
  formatDollars,
  formatDuration,
  plural,
} from "@/features/clock/lib/format";
import { clockLevelsPath } from "@/features/clock/lib/paths";
import { settingsReducer } from "@/features/clock/lib/structure-editor";
import { summarizeLevels } from "@/features/clock/lib/structures";
import type { TournamentClock } from "@/features/clock/types";
import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useReducer, useState } from "react";

type Props = {
  clock: TournamentClock;
  // Shows the saved clock at once, before its Realtime event.
  applyRow: (clock: TournamentClock) => void;
};

type FormProps = Props & { onSaved: () => void };

// The name, money, chips and rebuy limit in a form. Mounted each time the
// drawer opens, so it starts from what's saved.
function EditDetailsForm({ clock, applyRow, onSaved }: FormProps) {
  const { run, isPending } = useActionWithToast<ClockSettingsActionResult>(
    (result) => result.clock && applyRow(result.clock),
  );
  const [settings, dispatch] = useReducer(
    settingsReducer<ClockSettings>,
    clock,
    clockSettingsOf,
  );
  const errors = validateClockDetails(settings);

  const save = (): void => {
    const details: ClockDetails = {
      name: settings.name,
      buy_in: settings.buy_in,
      rebuy: settings.rebuy,
      starting_chips: settings.starting_chips,
      rebuy_chips: settings.rebuy_chips,
      max_rebuys: settings.max_rebuys,
    };
    run(
      "Couldn't save the details",
      () => updateClockSettingsAction(clock.id, details),
      onSaved,
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto px-4">
        <SettingsFields
          idPrefix="clock-details"
          settings={settings}
          errors={errors}
          dispatch={dispatch}
        />
      </div>
      <DrawerFooter>
        <Button disabled={errors.length > 0 || isPending} onClick={save}>
          {isPending ? <Spinner /> : "Save"}
        </Button>
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

// The Edit button and the drawer it opens.
function EditDetailsDrawer(props: Props) {
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
          <DrawerTitle>Details</DrawerTitle>
          <DrawerDescription>
            Changes show on every screen when saved.
          </DrawerDescription>
        </DrawerHeader>
        {isOpen && (
          <EditDetailsForm {...props} onSaved={() => setIsOpen(false)} />
        )}
      </DrawerContent>
    </Drawer>
  );
}

// One "label value" pair.
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 tabular-nums">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

// "18 levels · 3 breaks · 5h 20m", as in the template editor.
function levelsSummary(levels: TournamentClock["levels"]): string {
  const { levelCount, breakCount, lengthMs } = summarizeLevels(levels);
  return `${plural(levelCount, "level")} · ${plural(breakCount, "break")} · ${
    Number.isFinite(lengthMs) ? formatDuration(lengthMs) : "—"
  }`;
}

// The control screen's clock details: buy-in, chips, rebuy limit and a
// levels summary, with (until the clock finishes) an Edit button and an
// Edit levels link.
function DetailsCard({ clock, applyRow }: Props) {
  return (
    <Card className="py-4">
      <CardHeader className="items-center justify-between gap-2">
        <CardTitle className="text-base">Details</CardTitle>
        {clock.status !== "finished" && (
          <EditDetailsDrawer clock={clock} applyRow={applyRow} />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          <Detail label="Buy-in" value={formatDollars(clock.buy_in)} />
          <Detail label="Rebuy" value={formatDollars(clock.rebuy)} />
        </dl>
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          <Detail label="Chips" value={formatChips(clock.starting_chips)} />
          <Detail label="Rebuy chips" value={formatChips(clock.rebuy_chips)} />
        </dl>
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          <Detail label="Max rebuys" value={String(clock.max_rebuys)} />
        </dl>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-muted">{levelsSummary(clock.levels)}</p>
          {clock.status !== "finished" && (
            <Link
              href={clockLevelsPath(clock.id)}
              className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
            >
              Edit levels <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DetailsCard;
