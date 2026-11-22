"use client";

import { BottomTabAccessory } from "@/components/bottom-tabs/accessory";
import { Spinner } from "@/components/ui/spinner";
import { saveStructureAction } from "@/features/clock/actions/structures";
import BackLink from "@/features/clock/components/back-link";
import LevelsFields from "@/features/clock/components/structures/levels-fields";
import NewRowLengthFields from "@/features/clock/components/structures/new-row-length-fields";
import PayoutFields from "@/features/clock/components/structures/payout-fields";
import SettingsFields from "@/features/clock/components/structures/settings-fields";
import { useLeaveWarning } from "@/features/clock/hooks/use-leave-warning";
import { structureEditorReducer } from "@/features/clock/lib/structure-editor";
import {
  hasUnsavedChanges,
  type StructureDraft,
  validateStructureDraft,
} from "@/features/clock/lib/structures";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useReducer, useRef, useState, useTransition } from "react";

const STRUCTURES_HREF = "/admin/clock/structures";

type Props = {
  // null for a new template.
  id: string | null;
  initialDraft: StructureDraft;
};

// Edits a whole template (settings, payouts and levels) and saves it in one
// go. Changes stay local until Save.
function StructureEditor({ id, initialDraft }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [draft, dispatch] = useReducer(structureEditorReducer, initialDraft);
  const [savedDraft, setSavedDraft] = useState(initialDraft);
  const [isSaving, startSaving] = useTransition();
  const keyCount = useRef(0);

  const errors = validateStructureDraft(draft);
  const isDirty = hasUnsavedChanges(savedDraft, draft);
  const canSave = isDirty && errors.length === 0 && !isSaving;
  useLeaveWarning(isDirty && !isSaving);

  const nextKey = (): string => {
    keyCount.current += 1;
    return `new-row-${keyCount.current}`;
  };

  const save = (): void => {
    startSaving(async () => {
      const result = await saveStructureAction(id, draft);
      if (!result.success) {
        toast({
          title: "Couldn't save",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      setSavedDraft(draft);
      if (id === null && result.id) {
        router.replace(`/admin/clock/structures/${result.id}`);
        return;
      }
      toast({ title: "Template saved", description: draft.name.trim() });
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      <BackLink
        href={STRUCTURES_HREF}
        label="Blind Structures"
        isDirty={isDirty}
        description="Your changes to this template will be lost."
      />
      <SettingsFields
        idPrefix="structure"
        settings={draft}
        errors={errors}
        dispatch={dispatch}
        namePlaceholder="NLPT Standard"
      >
        <NewRowLengthFields draft={draft} dispatch={dispatch} />
      </SettingsFields>
      <PayoutFields
        idPrefix="structure"
        settings={draft}
        errors={errors}
        dispatch={dispatch}
      />
      <LevelsFields
        draft={draft}
        errors={errors}
        dispatch={dispatch}
        nextKey={nextKey}
      />
      <BottomTabAccessory
        className={cn(
          "transition-[filter] duration-150",
          canSave ? "border-primary" : "border-neutral-700",
        )}
      >
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className={cn(
            "flex size-full items-center justify-center text-sm font-semibold",
            canSave ? "bg-primary text-white" : "cursor-not-allowed text-muted",
          )}
        >
          {isSaving ? (
            <Spinner />
          ) : isDirty || id === null ? (
            "Save Template"
          ) : (
            "No Changes"
          )}
        </button>
      </BottomTabAccessory>
    </div>
  );
}

export default StructureEditor;
