# Tournament Clock Live Edits — Design

**Ticket:** none
**Date:** 2026-11-22
**Branch:** `feat/clock-live-edits` (from `master` after the clock shipped in #28)
**Status:** Built on dev and in PR #31 (into `staging`), 2026-11-22. What changed during the build is listed in the plan's "Changes from this plan".
**Builds on:** `docs/plans/2026-11-18-tournament-clock-design.md` (data model, timing, permissions)

## Goal

Fix mistakes and change plans while a tournament clock is running, without starting a new clock:

- Edit the clock's settings: name, buy-in, rebuy, starting and rebuy chips, max rebuys. (Payouts are already editable.)
- Fix a player: take away an accidental rebuy, and change who knocked a player out.
- Edit the blind levels: the current level and everything after it.

## Decisions

| Topic | Decision |
|---|---|
| Settings | All of them, in one **Edit** drawer on a new **Details** card. Same checks as creating a clock. Editable until the clock is finished (reopen to edit a finished one), like payouts. |
| Max rebuys below what a player already has | Allowed. It only stops further rebuys; no extra message. |
| Player fixes | **Take away a rebuy** (lowers the count by one) and **Knocked out by** (players who are out). Opened by tapping a player's name. |
| Re-entry mistakes | Taking away a rebuy never puts a player back out. To undo a mistaken re-entry, take the rebuy away and bust them again; the first bust's knockout stays recorded, so the same knocker would get it twice. Accepted for now. |
| Levels | Current and upcoming levels are editable on their own page, `/admin/clock/[id]/levels`, which reuses the template editor. Played levels are locked. |
| The current level | Blinds, ante, length and note can change; it can't be moved or removed, and nothing can be dropped above it. The time already played on it is kept. |
| Templates | Never touched. A clock's levels are its own snapshot. |
| Database | No changes. The existing admin update policies cover every write. |

## Clock details

- A **Details** card on the control screen, above Payouts, shows buy-in and rebuy, starting and rebuy chips, max rebuys, and a levels summary ("18 levels, 3 breaks · 5h 20m") with an **Edit levels** link.
- **Edit** opens a drawer with the name and those settings, using the shared `SettingsFields` from the new-clock form (no payouts; they keep their own drawer). It shows the form's errors under the fields.
- Save: `updateClockSettingsAction(clockId, settings)` checks admin, validates with the clock rules (`validateClockSettings`, payouts included as they're saved), updates the six columns where the clock isn't finished, and returns the saved row so the screen shows it at once. Every other screen gets it over Realtime: the name on the display and banner, the pool, average stack and payouts.
- The Edit button and the Edit levels link are hidden once the clock is finished.

## Edit player

- Tapping a player's name in the Players card opens an **Edit player** drawer. The row's Rebuy, Bust and Remove buttons stay as they are.
- **Rebuys:** the count, and **Take away a rebuy** when they have any. Refused on a finished clock. Saved only while the count is still what the screen showed (`.eq("rebuys", expected)`), like `rebuyEntrantAction`.
- **Knocked out by** (players who are out): a picker like the bust dialog's, with "Not recorded". The choices are players who were still in when this player went out: anyone still in, or anyone out after them (a better `finish_place`). Never the player themselves (also a database check). It updates the player's newest `_clock_knockouts` row, the one for their current bust.
- A change another screen made first is refused with the existing "The players changed on another screen. Try again."

## Edit levels page

`/admin/clock/[id]/levels`, linked from the Details card. A finished clock redirects to the control screen.

- **Top:** a back link to the control screen and a live line with the current level and time left (`useClock`).
- **List:** the template editor's levels timeline, with three kinds of rows:
  - **Played** (before the current level): greyed, no drag handle, can't be opened or removed.
  - **Current**: marked "Now" (read as "Now playing"); its fields can be edited; no drag handle, can't be removed, and drops above it are refused.
  - **Upcoming**: everything the template editor does: edit, drag, remove, add level, add break.
- A clock that hasn't started has no played or current rows: everything is editable.
- The page follows the clock live. When a level ends during editing, the rows realign by identity: played rows show what was actually played (whatever was typed into them is dropped), the current row is the level really being played, and the upcoming rows keep the admin's order. So however many levels pass, nothing is duplicated or lost.
- Each visit starts a fresh draft (the editor is keyed by the page's server time, since Cache Components keeps a page you leave mounted).
- Leaving with unsaved changes warns first: `beforeunload` for a reload or close, and a confirm on the back link, as the template editor does.
- **Save** sends the whole list. The page keeps its edits when a save is refused.

### What a save does

`planLevelEdit(clock, levels, nowMs)` in `features/clock/lib` returns the columns to save, or a refusal. The action loads the clock and the database time together (`loadClockAndTime`) and calls it.

1. **Catch up:** work out the level being played now with `getClockPosition`.
2. **Played levels** (`0 … current − 1`) are kept exactly as saved; whatever the page sent for them is ignored.
3. **Current level** stays at its index. The time already played on it is kept:
   - Running: `played = now − levelStartedAt`. If `played < newLength`, `level_started_at` stays the effective start (time left = new length − played). Otherwise the level ends now: `level_started_at = now − newLength`, so the next level starts now with its full time.
   - Paused: `played = oldLength − paused_remaining_ms`; `paused_remaining_ms = max(0, newLength − played)`.
   - Setup: the whole list is replaced; `level_index` stays 0.
   - Time added with +1 min counts as negative time played, so it carries over too (time left = new length − played can exceed the new length).
4. **Upcoming levels** take effect when reached; the display's next level and next break update straight away.
5. `level_index` is saved as the caught-up index, clamped to the new last level. Removing everything after the current level leaves the clock stopping at 0:00 at the end of it, as it does after the last level today.
6. If the clock moved on to the next level between the page's last update and the save, the first upcoming row on the page becomes the current level. It's what the admin set as next, so the save goes through.
7. Every row is checked with the template rules (`levelProblem`, at least one playing level). Refused: a finished clock, a bad row.

The update is conditional on the loaded `status`, `level_index` and timing column (`level_started_at` while running, `paused_remaining_ms` while paused), so a pause, resume, skip or ±1 min pressed on another screen in the meantime makes the save fail with "The clock changed on another screen. Try again." Every result passes the database's status check.

## Errors

- Field problems show under the field, as in the new-clock form and the template editor.
- Refusals show as a toast through `useActionWithToast` / `usePlayerAction`.

## Testing

Vitest, next to the code:

- `planLevelEdit`: running, paused and setup; the current level made longer, shorter, and shorter than the time played; time added with +1 min kept; played rows sent changed (ignored); every upcoming level removed; the clock having moved on mid-save; a finished clock and a bad row refused; every result passing the status rule (reuse the existing status-rule helper in the timing tests).
- Which rows are played, current and upcoming for a clock (the page's lock rule).
- Taking away a rebuy (count, zero, finished clock).
- The knocker choices (still in, out after, out before, themselves).
- Settings: existing `validateSettings` tests cover the rules; add only what the action adds.

Click-through on dev in the in-app browser, control screen beside the display: rename and change the buy-in; take away a rebuy (the pool drops); move a knockout (KO badges move); lengthen and shorten the current level while running and while paused; add a break ahead; reorder; let a level end with the page open (the row locks). Then a phone-width check on the iPhone over the LAN.

## Rollout

Dev → merge into `staging` for Vercel → PR to `master`. No migration, so nothing to apply to prod.

## Out of scope

- Undoing a mistaken re-entry so the player goes straight back to their old place.
- Undoing a bust that isn't the most recent.
- Swapping a player to a different member, or renaming a guest.
- Saving a clock's edited levels back to its template.

## Standards applied

- Scheels tech-standards-devs as general guidance: strict TypeScript, explicit types, early returns, single responsibility, TDD for the pure planners.
- Repo conventions from the clock phases: thin `app/` routes over `features/clock/{components,hooks,actions,data,lib}`; server actions re-check admin and return `{ success, message }`; conditional updates for anything another screen could change first; toasts via `useToast`; dev only until staging; no ticket prefix and no AI attribution in commits.
