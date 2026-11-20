-- Tournament clock, phase 1: permissions.
-- Plan: docs/plans/2026-11-19-tournament-clock-phase-1-schema.md (Task 2).
--
-- Same policies as _tournaments: anyone can read (TV and phone screens need
-- no login); only league admins write.

do $$
declare
  t text;
begin
  foreach t in array array['_blind_structures', '_blind_levels', '_tournament_clocks', '_clock_entrants']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon using (true)', t);
    execute format('create policy "members read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check ((select public.is_league_admin()))', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using ((select public.is_league_admin()))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using ((select public.is_league_admin()))', t);
  end loop;
end $$;
