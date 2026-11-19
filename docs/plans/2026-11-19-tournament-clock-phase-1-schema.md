# Tournament Clock Phase 1 (Schema) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** Create the database side of the tournament clock on dev: blind structure templates, clocks and entrants, with public read, admin-only write, Realtime and a server time function, plus matching TypeScript types.

**Architecture:** Four `_`-prefixed tables, following the v2 naming. A clock stores timestamps, not a ticking value; each screen counts down locally using `server_now()` to correct for its own clock, and Supabase Realtime pushes changes. Database rules enforce the rules from the design (≥3 places paid, payout split sums to 100, status/timestamp consistency, one place per bust-out), so a bad write is rejected even if the app has a bug. Permissions mirror `_tournaments`.

**Tech Stack:** Supabase Postgres (RLS, Realtime publication, SQL functions), TypeScript.

**Standards:** Scheels tech-standards-devs applied as general guidance (strict TS, explicit types). Repo conventions: migrations in `supabase/migrations/` applied with the Supabase MCP, dev first; `_`-prefixed v2 tables; v2 policy names (`public read`, `members read`, `admins insert/update/delete` using `is_league_admin()`).

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md`. Branch: `feat/tournament-shot-clock` (stacked on #25).

---

## Ground rules

- **Dev only** (`supabase-dev`, `vykeezhlyltsiuyqkode`). Prod (`supabase`, read-only) gets these migrations when the first clock UI ships (phase 4). They're purely additive and nothing in the app uses them before then.
- One migration per task. Commit the file, then apply exactly its contents to dev with `mcp__supabase-dev__apply_migration` using the same name.
- No ticket prefix and no AI attribution in commits.
- Verify inside `begin; … rollback;` blocks so test rows never persist.

## Facts (checked 2026-11-19)

- `supabase_realtime` publication exists on dev and prod with **no tables** in it yet.
- `_tournaments` policies: `public read` (anon, select true), `members read` (authenticated, select true), `admins insert` (check `(select is_league_admin())`), `admins update` / `admins delete` (using `(select is_league_admin())`). `is_league_admin()` checks `profiles.role = 'admin'`.
- No `server_now` function exists. Extensions available include `pgcrypto` (`gen_random_uuid()`).
- The `private` schema exists on both projects (it holds the profile role trigger function). It's for helpers that shouldn't be exposed through the API.

---

### Task 1: Migration — clock tables and rules

**Files:**
- Create: `supabase/migrations/<ts>_tournament_clock_schema.sql`

**Contract:**
- `private.payout_pcts_valid(pcts numeric[], places_paid int) returns boolean`: immutable. True when `array_length(pcts, 1) = places_paid - 1`, every value is > 0, and the values sum to 100. Use `create schema if not exists private`.
- **`_blind_structures`** (templates):
  - `id uuid pk default gen_random_uuid()`
  - `name text not null unique`
  - `default_buy_in numeric not null default 40 check (>= 0)`
  - `default_rebuy numeric not null default 40 check (>= 0)`
  - `default_starting_chips int not null check (> 0)`
  - `default_rebuy_chips int not null check (> 0)`
  - `default_places_paid int not null default 3 check (>= 3)`
  - `default_payout_pcts numeric[] not null default '{65,35}'`, checked with `payout_pcts_valid(default_payout_pcts, default_places_paid)`
  - `created_at timestamptz not null default now()`
- **`_blind_levels`** (a template's levels, in order):
  - `id uuid pk`
  - `structure_id uuid not null → _blind_structures on delete cascade`
  - `position int not null check (>= 1)`
  - `kind text not null check in ('level','break')`
  - `small_blind int`, `big_blind int`, `ante int not null default 0 check (>= 0)`
  - `duration_seconds int not null check (> 0)`
  - Check: a break has null blinds; a level has `small_blind > 0 and big_blind >= small_blind`.
  - `unique (structure_id, position)`, **deferrable initially deferred**, so a reorder can swap positions in one transaction.
- **`_tournament_clocks`**:
  - `id uuid pk`
  - `name text not null`
  - `structure_id uuid → _blind_structures on delete set null` (where it came from; information only)
  - `tournament_id uuid → _tournaments on delete set null` (set when the finish step saves)
  - `levels jsonb not null`: the snapshot of the template's levels; `check (jsonb_typeof(levels) = 'array' and jsonb_array_length(levels) > 0)`. The element shape matches a `_blind_levels` row without ids; the app validates it.
  - `status text not null default 'setup' check in ('setup','running','paused','finished')`
  - `level_index int not null default 0 check (>= 0)`
  - `level_started_at timestamptz`
  - `paused_remaining_ms int check (>= 0)`
  - `buy_in numeric not null check (>= 0)`, `rebuy numeric not null check (>= 0)`
  - `starting_chips int not null check (> 0)`, `rebuy_chips int not null check (> 0)`
  - `places_paid int not null check (>= 3)`
  - `payout_pcts numeric[] not null`, checked with `payout_pcts_valid(payout_pcts, places_paid)`
  - `created_at timestamptz not null default now()`
  - **Status consistency check:**
    - `setup` → `level_started_at` and `paused_remaining_ms` are null
    - `running` → `level_started_at` not null and `paused_remaining_ms` null
    - `paused` → `paused_remaining_ms` not null
    - `finished` → no constraint
- **`_clock_entrants`**:
  - `id uuid pk`
  - `clock_id uuid not null → _tournament_clocks on delete cascade`
  - `member_id uuid → members`
  - `guest_name text`
  - `rebuys int not null default 0 check (>= 0)`
  - `busted_at timestamptz`
  - `finish_place int check (>= 1)`
  - `created_at timestamptz not null default now()`
  - Check: exactly one of `member_id` or `guest_name` is set, and `guest_name` is non-blank when set.
  - Check: `(busted_at is null) = (finish_place is null)`.
  - Partial unique `(clock_id, member_id) where member_id is not null`: a member is in a clock at most once.
  - Partial unique `(clock_id, finish_place) where finish_place is not null`: no two players share a finishing place.
  - Index on `clock_id`.

**Verify on dev** (each in `begin; … rollback;`):
- Valid template and level insert → ok.
- A template with `default_places_paid 2` is rejected; so is one with pcts `{60,30}` (sums to 90).
- A level with `kind 'break'` and blinds set is rejected; so is a level with `big_blind < small_blind`.
- Swapping two level positions in one transaction succeeds (the unique rule is deferred).
- A clock with `status 'running'` and `level_started_at` null is rejected.
- An entrant with both `member_id` and `guest_name` is rejected; so is one with neither.
- The same member twice in one clock is rejected.
- Two entrants with the same `finish_place` in one clock are rejected.
- `busted_at` set without `finish_place` is rejected.

**Commit:** `feat: tournament clock tables`

### Task 2: Migration — permissions

**Files:**
- Create: `supabase/migrations/<ts>_tournament_clock_access.sql`

**Contract:** On all four tables, enable RLS and create the same five policies `_tournaments` has, with the same names and expressions:
- `public read` (anon, select)
- `members read` (authenticated, select)
- `admins insert`
- `admins update`
- `admins delete`

**Verify on dev** (in `begin; set local role anon; … rollback;`):
- anon can select from all four tables.
- anon inserting into `_tournament_clocks` fails with an RLS error.
- As `authenticated` without the admin role (`set local request.jwt.claims` to a non-admin `sub`), insert fails.
- **Optional:** with the dev admin's `sub`, insert succeeds. `is_league_admin()` reads `profiles` by `auth.uid()`.

**Commit:** `feat: tournament clock permissions`

### Task 3: Migration — Realtime and server time

**Files:**
- Create: `supabase/migrations/<ts>_tournament_clock_realtime.sql`

**Contract:**
- `alter publication supabase_realtime add table public._tournament_clocks, public._clock_entrants;`
- `alter table public._clock_entrants replica identity full;` A removed entrant's delete event then carries its `clock_id`. Realtime filters don't apply to deletes, so the client must also check `clock_id` itself; note this in the hook in phase 4.
- `public.server_now() returns timestamptz`, `language sql volatile`, `set search_path = ''`, body `select clock_timestamp()`. Grant execute to `anon, authenticated`. Use `clock_timestamp()` rather than `now()`, which is the transaction's start time.

**Verify on dev:**
- `select tablename from pg_publication_tables where pubname = 'supabase_realtime'` lists both tables.
- `begin; set local role anon; select public.server_now(); rollback;` returns the current time.
- `relreplident` for `_clock_entrants` is `'f'`.

**Commit:** `feat: tournament clock realtime and server time`

### Task 4: TypeScript types

**Files:**
- Create: `features/clock/types.ts`

**Contract:** Types matching the tables, numbers as `number`, timestamps as ISO `string`:
- `BlindLevel = { kind: "level" | "break"; small_blind: number | null; big_blind: number | null; ante: number; duration_seconds: number }`. This is the shape stored in `_tournament_clocks.levels`; a `_blind_levels` row is `BlindLevel` plus `id`, `structure_id` and `position`.
- `BlindStructure`
- `ClockStatus = "setup" | "running" | "paused" | "finished"`
- `TournamentClock` (`levels: BlindLevel[]`)
- `ClockEntrant`

Each gets a one-line comment naming its table. No runtime code: parsing and validating `levels` belongs to phase 2's pure logic.

**Verify:** `npx tsc --noEmit` clean, plus ESLint and Prettier on the file.

**Commit:** `feat: tournament clock types`

### Task 5: Migration — starter template (blocked on the user's blind structure)

**Files:**
- Create: `supabase/migrations/<ts>_tournament_clock_starter_structure.sql`

**Contract:**
- Insert the user's structure as one `_blind_structures` row (name, e.g., "NLPT Standard", plus starting and rebuy chips, $40 / $40, 3 paid, `{65,35}`).
- Insert its levels in order, with breaks as `kind 'break'`.
- Make it idempotent: `on conflict (name) do nothing` for the template, and levels inserted only when the template was created in this run.

**Wait for** the user's structure (levels with blinds, ante and minutes; breaks; starting and rebuy stacks). Don't guess values.

**Verify:** the levels come back in order, and every row passes the Task 1 checks.

**Commit:** `feat: seed starter blind structure`

### Task 6: Record decisions in the design doc

**Files:**
- Modify: `docs/plans/2026-11-18-tournament-clock-design.md`

**Changes:**
- Rename the tables to the `_`-prefixed names.
- Add to Decisions: players find the clock through a **"Tournament live" banner** that appears while a clock is running (phase 8); the finish step writes to `_tournaments` / `_tournament_sessions`.
- Note `server_now()`, `replica identity full`, and the `private.payout_pcts_valid` helper.
- Mark the routes, sync and phases sections as approved.

**Commit:** `docs: record clock phase 1 decisions`

---

## Refinement pass

### Task R1: Lint and Format
**Skill:** lint-and-format. Run Prettier and ESLint on `features/clock/types.ts`. Run `npx tsc --noEmit`.
Commit: `chore: fix lint and format violations` (skip if clean)

### Task R2–R5: Reduce Complexity / Improve Readability / Make It DRY / Standards Alignment
**Skills:** reduce-complexity, improve-readability, make-it-dry, standards-alignment. Phase 1 has almost no app code, so expect these to find nothing in the types file. Review the migrations for repeated checks: the payout rule is already shared through `private.payout_pcts_valid`. Skip any task with nothing to change; no empty commits.

## Next phases (not in this plan)

2. Pure logic + Vitest: effective level and remaining time, pool and average stack, payouts, finish results.
3. Template editor (`/admin/clock/structures`).
4. Clock core: create a clock, `useClock` (Realtime + `server_now` offset), display, admin controls. **Apply phase 1's migrations to prod with this PR.**
5. Entrants. 6. TV mode and sounds. 7. Finish step. 8. Navigation and the live banner.
