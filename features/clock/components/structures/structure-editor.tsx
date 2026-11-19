"use client";

import { BottomTabAccessory } from "@/components/bottom-tabs/accessory";
import { Spinner } from "@/components/ui/spinner";
import { saveStructureAction } from "@/features/clock/actions/structures";
import BackToStructuresLink from "@/features/clock/components/structures/back-to-structures-link";
import LevelsFields from "@/features/clock/components/structures/levels-fields";
import PayoutFields from "@/features/clock/components/structures/payout-fields";
import SettingsFields from "@/features/clock/components/structures/settings-fields";
import { structureEditorReducer } from "@/features/clock/lib/structure-editor";
import {
  type StructureDraft,
  validateStructureDraft,
} from "@/features/clock/lib/structures";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState, useTransition } from "react";

type Props = {
  // null for a new template.
  id: string | null;
  initialDraft: StructureDraft;
};

// Warns before closing or reloading the tab with unsaved changes.
function useUnsavedChangesWarning(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
}

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
  // The reducer returns the same object when nothing changed.
  const isDirty = draft !== savedDraft;
  const canSave = isDirty && errors.length === 0 && !isSaving;
  useUnsavedChangesWarning(isDirty && !isSaving);

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
      <BackToStructuresLink isDirty={isDirty} />
      <SettingsFields draft={draft} errors={errors} dispatch={dispatch} />
      <PayoutFields draft={draft} errors={errors} dispatch={dispatch} />
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
