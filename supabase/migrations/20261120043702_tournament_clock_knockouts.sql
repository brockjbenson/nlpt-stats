-- Tournament clock, phase 5: knockouts.
-- Plan: docs/plans/2026-11-19-tournament-clock-phase-5-entrants.md (Task 1).
--
-- Every bust is one row: who went out, who knocked them out (null = not
-- recorded) and when. The row stays if the player rebuys back in, since
-- the knockout still happened; undoing the bust deletes it.

-- Same-clock foreign keys below point at (clock_id, id), so it must be
-- unique. Guest names get the app's length limit.
alter table public._clock_entrants
  add constraint clock_entrants_clock_id_id_key unique (clock_id, id),
  add constraint clock_entrants_guest_name_length_check
    check (guest_name is null or char_length(btrim(guest_name)) <= 40);

create table public._clock_knockouts (
  id             uuid primary key default gen_random_uuid(),
  clock_id       uuid not null references public._tournament_clocks(id) on delete cascade,
  -- The player who went out.
  entrant_id     uuid not null,
  -- Who knocked them out; null when it wasn't recorded.
  knocked_out_by uuid,
  busted_at      timestamptz not null,
  created_at     timestamptz not null default now(),
  -- Both players are in the same clock. No cascade from players: a player
  -- in a knockout can't be removed, but deleting the clock removes both.
  constraint clock_knockouts_entrant_fkey
    foreign key (clock_id, entrant_id) references public._clock_entrants (clock_id, id),
  constraint clock_knockouts_knocked_out_by_fkey
    foreign key (clock_id, knocked_out_by) references public._clock_entrants (clock_id, id),
  constraint clock_knockouts_not_self_check
    check (knocked_out_by is distinct from entrant_id)
);

create index clock_knockouts_entrant_idx
  on public._clock_knockouts (clock_id, entrant_id);
create index clock_knockouts_knocked_out_by_idx
  on public._clock_knockouts (clock_id, knocked_out_by);

-- Same policies as the other clock tables: anyone reads, league admins write.
alter table public._clock_knockouts enable row level security;
create policy "public read" on public._clock_knockouts
  for select to anon using (true);
create policy "members read" on public._clock_knockouts
  for select to authenticated using (true);
create policy "admins insert" on public._clock_knockouts
  for insert to authenticated with check ((select public.is_league_admin()));
create policy "admins update" on public._clock_knockouts
  for update to authenticated using ((select public.is_league_admin()));
create policy "admins delete" on public._clock_knockouts
  for delete to authenticated using ((select public.is_league_admin()));

-- Push knockouts to every open screen. Delete events then carry the whole
-- old row, including clock_id (Realtime doesn't filter deletes).
alter publication supabase_realtime add table public._clock_knockouts;
alter table public._clock_knockouts replica identity full;

-- A bust: the player's finishing place and its knockout row, in one
-- transaction. security invoker, so RLS decides who can write. The unique
-- finishing place per clock refuses a second screen busting into the same
-- place (unique_violation); a player already out raises no_data_found.
create or replace function public.bust_clock_entrant(
  p_entrant_id uuid,
  p_finish_place int,
  p_busted_at timestamptz,
  p_knocked_out_by uuid
)
returns public._clock_entrants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_entrant public._clock_entrants;
begin
  update public._clock_entrants
     set busted_at = p_busted_at, finish_place = p_finish_place
   where id = p_entrant_id and busted_at is null
  returning * into v_entrant;

  if not found then
    raise exception 'This player is already out or no longer exists.'
      using errcode = 'no_data_found';
  end if;

  insert into public._clock_knockouts (clock_id, entrant_id, knocked_out_by, busted_at)
  values (v_entrant.clock_id, v_entrant.id, p_knocked_out_by, p_busted_at);

  return v_entrant;
end;
$$;

-- Undoing a bust: clears the player's place and deletes their newest
-- knockout row, in one transaction.
create or replace function public.undo_clock_bust(p_entrant_id uuid)
returns public._clock_entrants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_entrant public._clock_entrants;
begin
  update public._clock_entrants
     set busted_at = null, finish_place = null
   where id = p_entrant_id and busted_at is not null
  returning * into v_entrant;

  if not found then
    raise exception 'This player isn''t out or no longer exists.'
      using errcode = 'no_data_found';
  end if;

  delete from public._clock_knockouts
   where id = (
     select id from public._clock_knockouts
      where entrant_id = p_entrant_id
      order by busted_at desc, created_at desc
      limit 1
   );

  return v_entrant;
end;
$$;

revoke execute on function public.bust_clock_entrant(uuid, int, timestamptz, uuid) from public, anon;
grant execute on function public.bust_clock_entrant(uuid, int, timestamptz, uuid) to authenticated;
revoke execute on function public.undo_clock_bust(uuid) from public, anon;
grant execute on function public.undo_clock_bust(uuid) to authenticated;
