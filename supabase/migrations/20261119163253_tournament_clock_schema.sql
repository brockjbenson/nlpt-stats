-- Tournament clock, phase 1: tables and rules.
-- Plan: docs/plans/2026-11-19-tournament-clock-phase-1-schema.md (Task 1).
--
-- A clock stores timestamps, not a ticking value. Each screen counts down
-- locally from level_started_at (corrected with server_now()), so the
-- database only changes when someone starts, pauses or moves a level.

create schema if not exists private;

-- Payouts are a straight share of the pool: one percentage per paid place,
-- each above zero, adding up to 100.
create or replace function private.payout_pcts_valid(pcts numeric[], places_paid int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(pcts, 1), 0) = places_paid
     and not exists (select 1 from unnest(pcts) p where p is null or p <= 0)
     and (select sum(p) from unnest(pcts) p) = 100;
$$;

-- Blind structure templates.
create table public._blind_structures (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null unique,
  default_buy_in         numeric not null default 40 check (default_buy_in >= 0),
  default_rebuy          numeric not null default 40 check (default_rebuy >= 0),
  default_starting_chips int not null check (default_starting_chips > 0),
  default_rebuy_chips    int not null check (default_rebuy_chips > 0),
  default_places_paid    int not null default 4 check (default_places_paid >= 3),
  default_payout_pcts    numeric[] not null default '{45,30,15,10}',
  -- Per player. The "no rebuys once in the money" cutoff changes during
  -- play, so the app enforces that one.
  default_max_rebuys     int not null default 2 check (default_max_rebuys >= 0),
  created_at             timestamptz not null default now(),
  constraint blind_structures_payout_pcts_check
    check (private.payout_pcts_valid(default_payout_pcts, default_places_paid))
);

-- A template's levels and breaks, in order.
create table public._blind_levels (
  id               uuid primary key default gen_random_uuid(),
  structure_id     uuid not null references public._blind_structures(id) on delete cascade,
  position         int not null check (position >= 1),
  kind             text not null check (kind in ('level', 'break')),
  small_blind      int,
  big_blind        int,
  ante             int not null default 0 check (ante >= 0),
  duration_seconds int not null check (duration_seconds > 0),
  constraint blind_levels_blinds_check check (
    case kind
      when 'break' then small_blind is null and big_blind is null
      else small_blind > 0 and big_blind >= small_blind
    end
  ),
  -- Deferred so a reorder can swap positions in one transaction.
  constraint blind_levels_structure_position_key
    unique (structure_id, position) deferrable initially deferred
);

-- A running (or finished) tournament clock.
create table public._tournament_clocks (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  structure_id        uuid references public._blind_structures(id) on delete set null,
  tournament_id       uuid references public._tournaments(id) on delete set null,
  -- Snapshot of the template's levels: editing a template never changes a
  -- clock already made from it. The app validates the element shape.
  levels              jsonb not null check (
                        jsonb_typeof(levels) = 'array' and jsonb_array_length(levels) > 0
                      ),
  status              text not null default 'setup'
                        check (status in ('setup', 'running', 'paused', 'finished')),
  level_index         int not null default 0 check (level_index >= 0),
  level_started_at    timestamptz,
  paused_remaining_ms int check (paused_remaining_ms >= 0),
  buy_in              numeric not null check (buy_in >= 0),
  rebuy               numeric not null check (rebuy >= 0),
  starting_chips      int not null check (starting_chips > 0),
  rebuy_chips         int not null check (rebuy_chips > 0),
  places_paid         int not null check (places_paid >= 3),
  payout_pcts         numeric[] not null,
  max_rebuys          int not null check (max_rebuys >= 0),
  created_at          timestamptz not null default now(),
  constraint tournament_clocks_payout_pcts_check
    check (private.payout_pcts_valid(payout_pcts, places_paid)),
  constraint tournament_clocks_status_fields_check check (
    case status
      when 'setup'   then level_started_at is null and paused_remaining_ms is null
      when 'running' then level_started_at is not null and paused_remaining_ms is null
      when 'paused'  then paused_remaining_ms is not null
      else true
    end
  )
);

-- Players in a clock: a member or a named guest.
create table public._clock_entrants (
  id           uuid primary key default gen_random_uuid(),
  clock_id     uuid not null references public._tournament_clocks(id) on delete cascade,
  member_id    uuid references public.members(id),
  guest_name   text,
  rebuys       int not null default 0 check (rebuys >= 0),
  busted_at    timestamptz,
  finish_place int check (finish_place >= 1),
  created_at   timestamptz not null default now(),
  constraint clock_entrants_identity_check check (
    (member_id is not null and guest_name is null)
    or (member_id is null and guest_name is not null and btrim(guest_name) <> '')
  ),
  constraint clock_entrants_bust_check check ((busted_at is null) = (finish_place is null))
);

create unique index clock_entrants_member_key
  on public._clock_entrants (clock_id, member_id) where member_id is not null;
create unique index clock_entrants_finish_place_key
  on public._clock_entrants (clock_id, finish_place) where finish_place is not null;
create index clock_entrants_clock_id_idx on public._clock_entrants (clock_id);
