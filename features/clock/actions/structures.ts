"use server";

import { revalidatePath } from "next/cache";
import { getStructure } from "@/features/clock/data/structures";
import {
  copyName,
  draftToSaveInput,
  type StructureDraft,
  type StructureError,
  structureToDraft,
  validateStructureDraft,
} from "@/features/clock/lib/structures";
import { isAdmin } from "@/features/clock/actions/is-admin";
import { createClient } from "@/utils/supabase/server";

export type StructureActionResult = {
  success: boolean;
  message: string;
  // The saved template's id.
  id?: string;
  // Field problems, when the draft didn't pass validation.
  errors?: StructureError[];
};

const STRUCTURES_PATH = "/admin/clock/structures";
const NOT_ADMIN: StructureActionResult = {
  success: false,
  message: "Only admins can change blind structures.",
};

// Postgres error codes.
const UNIQUE_VIOLATION = "23505";
const NO_DATA_FOUND = "P0002";

function saveErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === UNIQUE_VIOLATION) {
    return "A template with this name already exists.";
  }
  if (error.code === NO_DATA_FOUND) return "This template no longer exists.";
  return error.message;
}

function revalidateStructures(id?: string): void {
  revalidatePath(STRUCTURES_PATH);
  if (id) revalidatePath(`${STRUCTURES_PATH}/${id}`);
}

// Validates and saves a whole template (settings and levels) in one
// transaction. id null creates a new template.
async function saveDraft(
  id: string | null,
  draft: StructureDraft,
): Promise<StructureActionResult> {
  const errors = validateStructureDraft(draft);
  if (errors.length > 0) {
    return { success: false, message: "Fix the highlighted fields.", errors };
  }

  const db = await createClient();
  const { structure, levels } = draftToSaveInput(draft);
  const { data, error } = await db.rpc("save_blind_structure", {
    p_id: id,
    p_structure: structure,
    p_levels: levels,
  });
  if (error) return { success: false, message: saveErrorMessage(error) };

  const savedId = data as string;
  revalidateStructures(savedId);
  return { success: true, message: "Template saved.", id: savedId };
}

export async function saveStructureAction(
  id: string | null,
  draft: StructureDraft,
): Promise<StructureActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    return await saveDraft(id, draft);
  } catch (error) {
    // A malformed draft from the client can throw in validation.
    console.error("Error saving blind structure:", error);
    return { success: false, message: "Couldn't save this template." };
  }
}

// Saves a copy named "Copy of <name>" (numbered if that's taken).
export async function duplicateStructureAction(
  id: string,
): Promise<StructureActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;

  const db = await createClient();
  const [{ data: original, error }, { data: names, error: namesError }] =
    await Promise.all([
      getStructure(db, id),
      db.from("_blind_structures").select("name"),
    ]);
  const loadError = error ?? namesError;
  if (loadError) return { success: false, message: loadError.message };
  if (!original) {
    return { success: false, message: "This template no longer exists." };
  }

  const takenNames = (names ?? []).map(({ name }) => name as string);
  const name = copyName(original.name, takenNames);
  const result = await saveDraft(null, {
    ...structureToDraft(original, original.levels),
    name,
  });
  return result.success
    ? { ...result, message: `Saved a copy as "${name}".` }
    : result;
}

// Deletes a template and its levels. Clocks made from it keep their own
// copy of the levels.
export async function deleteStructureAction(
  id: string,
): Promise<StructureActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;

  const db = await createClient();
  const { data, error } = await db
    .from("_blind_structures")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { success: false, message: error.message };
  if (!data || data.length === 0) {
    return { success: false, message: "This template no longer exists." };
  }

  revalidateStructures();
  return { success: true, message: "Template deleted." };
}
