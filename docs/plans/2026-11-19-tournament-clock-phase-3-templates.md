# Tournament Clock Phase 3 (Template Editor) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Let admins list, create, edit, duplicate and delete blind structure templates at `/admin/clock/structures`, including each template's money, chips, payouts, rebuy limit, and its levels and breaks.

**Architecture:** Server components load templates from `_blind_structures` / `_blind_levels`. One client component, `StructureEditor`, edits a whole template in local state through a pure reducer (tested with Vitest). Saving sends the whole template to one server action. The action checks for an admin, validates with the same pure rules, and calls a new database function, `save_blind_structure`, which writes the template and replaces its levels in **one transaction**, so a template is never half-saved. Levels are reordered with up/down buttons: no drag-and-drop dependency, and they work on a phone.

**Tech Stack:** Next.js 16 App Router (server components, server actions), React 19, shadcn/ui (`Card`, `Field`, `Input`, `Button`, `Select`, `AlertDialog`), Supabase (RLS, SQL function), Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,actions,data,lib}`; server actions re-check `getCurrentUser().isAdmin` (as `addTournamentSessionAction` does) on top of RLS and the `proxy.ts` gate; return `{ success, message }`; toasts via `useToast`; migrations applied to **dev only** with the Supabase MCP; no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (route `/admin/clock/structures`). Earlier phases: `docs/plans/2026-11-19-tournament-clock-phase-1-schema.md`, `docs/plans/2026-11-19-tournament-clock-phase-2-logic.md`. Branch: `feat/tournament-shot-clock`.

---

## Decisions made in this plan (confirm before starting)

1. **Reorder with up/down buttons**, not drag and drop. No new dependency; reliable on a phone.
2. **Save the whole template at once** (settings and levels together) with a Save button, not field-by-field autosave. Leaving with unsaved changes asks for confirmation.
3. **Durations are entered in minutes** (whole minutes); stored as seconds.
4. **Changing places paid fills in a suggested split** for 3, 4 or 5 places (50/30/20, 45/30/15/10, 40/25/17/11/7, from the design doc). For other counts the list is resized and the admin types the split.
5. **"Add level" copies the last playing level's length and moves to the next round big blind**: 1, 1.5, 2, 3, 4, 5, 6, 8 × each power of ten (…, 600, 800, 1,000, 1,500, 2,000, 3,000, 4,000, 5,000, …), a 25-50% raise that never doubles; the small blind is half (after 300/600 it suggests 400/800; after 30,000 → 40,000). The admin edits as needed.
6. **Duplicate** makes "Copy of <name>"; delete asks for confirmation. Clocks already made from a template keep their own copy of the levels, so editing or deleting a template never changes a clock.
7. Admin nav gets a **Clock** group with **Blind Structures**. Public navigation and the live banner stay in phase 8.

## Ground rules

- **Dev only** for the migration (`supabase-dev`). Prod gets every clock migration with phase 4.
- Pure logic lives in `features/clock/lib/` (no React/Supabase), tests next to it.
- Run the app against dev with `npm run dev` (`.env.development.local` points at dev). The dev admin profile can sign in.

## Facts (checked 2026-11-19)

- Dev has one template, `NLPT Standard` (19 rows), from phase 1.
- `_blind_levels (structure_id, position)` is unique and deferred; deleting and re-inserting levels in one transaction is fine.
- `features/clock/lib/levels.ts` has the level rules in a private `levelProblem`; this phase exports it so the editor shows the same messages.
- There is no form or drag-and-drop library in the repo. `components/ui` has `field`, `input`, `select`, `alert-dialog`, `card`, `empty`, `spinner`, `toast`.
- `app/admin/loading.tsx` already gives admin pages a loading state.

---

### Task 1: Migration — `save_blind_structure`

**Files:**
- Create: `supabase/migrations/<ts>_save_blind_structure.sql`

**Contract:** `public.save_blind_structure(p_id uuid, p_structure jsonb, p_levels jsonb) returns uuid`
- `language plpgsql`, `security invoker` (RLS decides who may write), `set search_path = ''`.
- `p_structure` keys: `name`, `default_buy_in`, `default_rebuy`, `default_starting_chips`, `default_rebuy_chips`, `default_places_paid`, `default_payout_pcts` (array), `default_max_rebuys`.
- `p_levels`: array of `{ kind, small_blind, big_blind, ante, duration_seconds }`; position is the array order (1-based, via `with ordinality`).
- `p_id` null → insert the template; otherwise update it, raising `no_data_found` if no row was updated (missing, or not allowed by RLS).
- Then delete the template's levels and insert `p_levels`. Returns the template id.
- Every table check from phase 1 still applies, so bad data raises and the whole call rolls back.
- `revoke execute ... from public, anon; grant execute ... to authenticated;`

**Verify on dev** (each in a block that's undone, as in phase 1):
- As the dev admin: insert a new template with 3 rows → id returned, 3 levels in order.
- As the dev admin: update `NLPT Standard` with 2 rows → 2 levels; rolled back afterwards.
- A bad level (break with blinds) → error, and the template's levels are unchanged.
- As a non-admin authenticated user → RLS error; as anon → permission denied.
- A duplicate name → unique violation (`23505`).

**Commit:** `feat: save blind structures in one transaction`

### Task 2: Template drafts and validation (pure)

**Files:**
- Modify: `features/clock/lib/levels.ts` (export `levelProblem`)
- Create: `features/clock/lib/structures.ts`, `features/clock/lib/structures.test.ts`

**Contract:**
- `type DraftLevel = BlindLevel & { key: string }` (`key` is a stable React key, never saved).
- `type StructureDraft = { name: string; buy_in: number; rebuy: number; starting_chips: number; rebuy_chips: number; places_paid: number; payout_pcts: number[]; max_rebuys: number; levels: DraftLevel[] }`.
- `SUGGESTED_SPLITS: Record<number, number[]>` for 3, 4 and 5 places.
- `newStructureDraft(): StructureDraft`: NLPT defaults ($40/$40, 20,000/20,000 chips, 4 paid at 45/30/15/10, max 2 rebuys) and one 100/200 20-minute level.
- `structureToDraft(structure: BlindStructure, levels: BlindStructureLevel[]): StructureDraft` (levels sorted by position).
- `draftToSaveInput(draft): { structure: {...database column names}; levels: BlindLevel[] }` (trims the name, drops keys).
- `validateStructureDraft(draft): StructureError[]` where `StructureError = { field: "name" | "money" | "chips" | "places_paid" | "payout_pcts" | "max_rebuys" | "levels"; levelIndex?: number; message: string }`. Rules:
  - name not blank, at most 60 characters;
  - buy-in and rebuy are numbers ≥ 0;
  - chips are whole numbers > 0;
  - places paid is a whole number ≥ 3;
  - payout: one % per paid place, each > 0, summing to 100 (within 0.000001);
  - max rebuys is a whole number ≥ 0;
  - at least one playing level, and each row passes `levelProblem` (message carries `levelIndex`).
- `summarizeLevels(levels): { levelCount: number; breakCount: number; lengthMs: number }`.

**Tests:**
- `newStructureDraft()` has no errors; NLPT Standard → draft → save input round-trips the 19 rows.
- Each rule above: one failing draft per rule, with the expected `field` (and `levelIndex` for a bad row).
- Percentages 33.3 / 33.3 / 33.4 are accepted; 45/30/15/5 is not.
- `summarizeLevels(NLPT Standard)` → 16, 3, 5h 50m.

**Commit:** `feat: blind structure drafts and validation`

### Task 3: Editor reducer (pure)

**Files:** Create `features/clock/lib/structure-editor.ts`, `features/clock/lib/structure-editor.test.ts`

**Contract:** `structureEditorReducer(draft: StructureDraft, action: StructureEditorAction): StructureDraft`, with actions:
- `setField` (name, buy_in, rebuy, starting_chips, rebuy_chips, max_rebuys)
- `setPlacesPaid` (fills `SUGGESTED_SPLITS[n]` when there is one; otherwise keeps the existing values, trimming or padding with 0)
- `setPayoutPct` (index, value)
- `addLevel` (appends a level suggested from the last playing level: its length, small blind = its big blind, big blind = double; 100/200 at 20 min when there is none)
- `addBreak` (appends a 10-minute break)
- `updateLevel` (index, partial level; changing `kind` to break clears blinds, to level fills the suggestion)
- `moveLevel` (index, "up" | "down"; no-op at the ends)
- `removeLevel` (index; the last remaining row can't be removed)

New rows get a fresh `key` from a counter passed in the action (keeps the reducer pure).

**Tests:** one or more per action, including the suggestion after 300/600 → 600/1,200, kind switching, moving the first row up (no change), removing the only row (no change), and places paid 4 → 3 → 6.

**Commit:** `feat: blind structure editor reducer`

### Task 4: Data and server actions

**Files:**
- Create: `features/clock/data/structures.ts`
  - `getStructures(db)`: templates with their levels (embedded `_blind_levels`), sorted by name; levels sorted by position.
  - `getStructure(db, id)`: one template with levels, or null.
- Create: `features/clock/actions/structures.ts` (`"use server"`), each returning `{ success: boolean; message: string; id?: string; errors?: StructureError[] }`:
  - `saveStructureAction(id: string | null, draft: StructureDraft)`: admin check, `validateStructureDraft` (return the errors without saving), `draftToSaveInput`, `rpc("save_blind_structure")`; `23505` → "A template with this name already exists."; then `revalidatePath` the list and edit pages.
  - `duplicateStructureAction(id)`: loads it, saves a copy named "Copy of <name>" (or "Copy 2 of <name>" etc. if taken).
  - `deleteStructureAction(id)`: admin check, delete (levels cascade), revalidate.

**Verify:** `npx tsc --noEmit` and ESLint clean. These are exercised in the browser in Task 7; no unit tests (they're thin wrappers over Supabase).

**Commit:** `feat: blind structure data and actions`

### Task 5: Templates list page and admin nav

**Files:**
- Create: `app/admin/clock/structures/page.tsx` (server; loads `getStructures`, `ErrorHandler` on failure)
- Create: `features/clock/components/structures/structure-list.tsx`, `structure-card.tsx`, `delete-structure-button.tsx`, `duplicate-structure-button.tsx`
- Modify: `components/admin-nav/admin-links.tsx` (new "Clock" group: "Blind Structures" → `/admin/clock/structures`)

**Behavior:**
- `PageHeader` "Blind Structures" with an "Add Template" link (`ADMIN_ACTION_CLASS`) to `/admin/clock/structures/new`.
- One card per template: name; "16 levels · 3 breaks · 5h 50m"; "$40 buy-in · $40 rebuy · 20,000 chips"; "4 paid: 45 / 30 / 15 / 10"; edit (link), duplicate, delete (confirm dialog naming the template, toast on result). Cards in a responsive grid like the seasons page.
- Empty state (`Empty`) with an Add Template button when there are none.

**Verify:** the page renders on dev with NLPT Standard; the Admin menu shows the new link on desktop and mobile.

**Commit:** `feat: blind structures list`

### Task 6: Template editor pages

**Files:**
- Create: `app/admin/clock/structures/new/page.tsx` (renders the editor with `newStructureDraft()`)
- Create: `app/admin/clock/structures/[id]/page.tsx` (loads `getStructure`; `notFound()` if missing)
- Create: `features/clock/components/structures/structure-editor.tsx` (client; `useReducer(structureEditorReducer)`)
- Create: `features/clock/components/structures/level-row.tsx`, `payout-fields.tsx`, `structure-summary.tsx`
- Modify: `features/clock/lib/format.ts` and its test (`formatDuration(ms)`: "5h 50m", "20m", "1h")

**Behavior:**
- **Settings card:** name; buy-in and rebuy ($); starting and rebuy chips; max rebuys per player.
- **Payouts card:** places paid; one % input per place; a running total that turns red unless it's 100%.
- **Levels card:** numbered rows ("Level 5", "Break") with a drag handle (reorder by dragging, with mouse, touch or keyboard), kind select, small blind, big blind, ante, minutes, and a remove button (with `aria-label`s). Breaks show only minutes. "Add level" and "Add break" buttons below.
- **Summary bar** (sticky at the bottom on mobile): levels, breaks, total length, and Save. Save is disabled while saving or while `validateStructureDraft` reports errors; errors show next to their fields (and the row for level errors).
- Saving a new template redirects to its edit page; saving an existing one shows a toast and stays. Server errors show in a toast.
- Leaving with unsaved changes (Back link or closing the tab) asks for confirmation (`beforeunload` plus a confirm on the Back link).

**Verify:** `npm test` (formatDuration), `npx tsc --noEmit`, ESLint.

**Commit:** `feat: blind structure editor`

### Task 7: Check it in the browser and update the design doc

**Files:** Modify `docs/plans/2026-11-18-tournament-clock-design.md`

**Click-through on dev** (`npm run dev`, signed in as the dev admin; desktop width and phone width):
- The list shows NLPT Standard with 16 levels · 3 breaks · 5h 50m.
- Duplicate it → "Copy of NLPT Standard" appears. Edit the copy: rename, change places paid to 3 (split becomes 50/30/20), add a level (suggests 20,000/40,000), add a break, move the break up, remove a level, save → toast; reload shows the changes.
- Type a payout split that adds to 95 → Save disabled, the total is red.
- Rename the copy to "NLPT Standard" → "A template with this name already exists."
- Delete the copy → confirm → gone. NLPT Standard is unchanged (check the rows on dev).
- New template from "Add Template" → save → lands on its edit page; delete it afterwards.
- Signed out, `/admin/clock/structures` redirects like other admin pages.

**Design doc:** record the Decisions above, the `save_blind_structure` function, and mark phase 3 done.

**Commit:** `docs: record clock phase 3 decisions`

---

## Refinement pass

### Task R1: Lint and Format
**Skill:** lint-and-format. Prettier and ESLint on changed files, `npx tsc --noEmit` (ignore stale `.next/` errors), `npm test`.
Commit: `chore: fix lint and format violations` (skip if clean)

### Task R2: Reduce Complexity
**Skill:** reduce-complexity. Watch `StructureEditor` size (split into the section components above if it grows past ~150 lines) and the reducer's switch.
Commit: `refactor: simplify the structure editor` (skip if nothing to change)

### Task R3: Improve Readability
**Skill:** improve-readability. Names for magic numbers (break length, name length limit, suggestion multiplier).
Commit: `refactor: clarify structure editor names` (skip if nothing to change)

### Task R4: Make It DRY
**Skill:** make-it-dry. Likely candidates: number inputs with label and error (if repeated 3+ times, extract a small `NumberField`); money/chip formatting shared with the clock display later.
Commit: `refactor: share structure editor fields` (skip if nothing to change)

### Task R5: Standards Alignment
**Skill:** standards-alignment. Explicit return types, no `any`, accessible labels on icon buttons, no `console.log`.
Commit: `refactor: align structure editor with standards` (skip if nothing to change)

## Next phases (not in this plan)

4. Clock core: create a clock from a template, `useClock`, display, admin controls. **Apply all clock migrations to prod with this PR.**
5. Entrants. 6. TV mode and sounds. 7. Finish step. 8. Navigation and the live banner.
