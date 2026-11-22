"use client";

import { BottomTabAccessory } from "@/components/bottom-tabs/accessory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createClockAction } from "@/features/clock/actions/clocks";
import PayoutFields from "@/features/clock/components/structures/payout-fields";
import SettingsFields from "@/features/clock/components/structures/settings-fields";
import type { StructureWithLevels } from "@/features/clock/data/structures";
import {
  type ClockSettings,
  clockSettingsFromStructure,
  validateClockSettings,
} from "@/features/clock/lib/clocks";
import { formatLevelsSummary } from "@/features/clock/lib/format";
import { CLOCKS_PATH, clockControlPath } from "@/features/clock/lib/paths";
import { settingsReducer } from "@/features/clock/lib/structure-editor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useState, useTransition } from "react";

// Picked first when it exists: the league's usual structure.
const DEFAULT_STRUCTURE_NAME = "NLPT Standard";

function defaultStructureId(structures: StructureWithLevels[]): string {
  const preferred = structures.find(
    ({ name }) => name === DEFAULT_STRUCTURE_NAME,
  );
  return (preferred ?? structures[0]).id;
}

function TemplatePicker({
  structures,
  structure,
  onChange,
}: {
  structures: StructureWithLevels[];
  structure: StructureWithLevels;
  onChange: (id: string) => void;
}) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">Template</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Select value={structure.id} onValueChange={onChange}>
          <SelectTrigger
            className="h-9 border border-border text-sm"
            aria-label="Template"
          >
            {/* The name as children, so it shows before hydration too. */}
            <SelectValue>{structure.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {structures.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted">
          {formatLevelsSummary(structure.levels)}. The levels come from the
          template; edit it to change them.
        </p>
      </CardContent>
    </Card>
  );
}

// The template's money, chips and payouts, editable before the clock is
// made. Keyed by template, so picking another one starts over from its
// defaults.
function NewClockSettings({ structure }: { structure: StructureWithLevels }) {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, dispatch] = useReducer(
    settingsReducer<ClockSettings>,
    structure,
    clockSettingsFromStructure,
  );
  const [isCreating, startCreating] = useTransition();
  const errors = validateClockSettings(settings);
  const canCreate = errors.length === 0 && !isCreating;

  const create = (): void => {
    startCreating(async () => {
      const result = await createClockAction(structure.id, settings);
      if (!result.success || !result.id) {
        toast({
          title: "Couldn't create the clock",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      router.push(clockControlPath(result.id));
    });
  };

  return (
    <>
      <SettingsFields
        idPrefix="clock"
        settings={settings}
        errors={errors}
        dispatch={dispatch}
        namePlaceholder={structure.name}
      />
      <PayoutFields
        idPrefix="clock"
        settings={settings}
        errors={errors}
        dispatch={dispatch}
      />
      <BottomTabAccessory
        className={cn(
          "transition-[filter] duration-150",
          canCreate ? "border-primary" : "border-neutral-700",
        )}
      >
        <button
          type="button"
          onClick={create}
          disabled={!canCreate}
          className={cn(
            "flex size-full items-center justify-center text-sm font-semibold",
            canCreate
              ? "bg-primary text-white"
              : "cursor-not-allowed text-muted",
          )}
        >
          {isCreating ? <Spinner /> : "Create Clock"}
        </button>
      </BottomTabAccessory>
    </>
  );
}

// Makes a clock: pick a template, adjust its settings, create. Levels
// can't be changed per clock.
function CreateClockForm({
  structures,
}: {
  // At least one.
  structures: StructureWithLevels[];
}) {
  const [structureId, setStructureId] = useState(() =>
    defaultStructureId(structures),
  );
  const structure =
    structures.find(({ id }) => id === structureId) ?? structures[0];

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      <Link
        href={CLOCKS_PATH}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
      >
        <ChevronLeft size={16} /> Clocks
      </Link>
      <TemplatePicker
        structures={structures}
        structure={structure}
        onChange={setStructureId}
      />
      <NewClockSettings key={structure.id} structure={structure} />
    </div>
  );
}

export default CreateClockForm;
