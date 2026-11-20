-- Tournament clock, phase 1: Realtime and server time.
-- Plan: docs/plans/2026-11-19-tournament-clock-phase-1-schema.md (Task 3).

-- Push clock and entrant changes to every open screen.
alter publication supabase_realtime add table public._tournament_clocks, public._clock_entrants;

-- Delete events then carry the whole old row, including clock_id. Realtime
-- filters don't apply to deletes, so the client still checks clock_id itself.
alter table public._clock_entrants replica identity full;

-- The database's current time, so each screen can correct for its own clock
-- drift. clock_timestamp() rather than now(), which is the transaction start.
create or replace function public.server_now()
returns timestamptz
language sql
volatile
set search_path = ''
as $$
  select clock_timestamp();
$$;

grant execute on function public.server_now() to anon, authenticated;
