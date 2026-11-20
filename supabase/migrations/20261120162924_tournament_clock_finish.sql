-- Tournament clock, phase 7: finishing a clock and saving its results.
-- Plan: docs/plans/2026-11-20-tournament-clock-phase-7-finish-flow.md (Task 1).
--
-- All three functions are security invoker, so RLS decides who can write
-- (league admins), and each runs in one transaction.

-- Ends a clock: places its one remaining player 1st and stops the clock
-- where it got to. The clock is updated first, which locks it, so two
-- screens can't both finish it. Raises no_data_found when the clock isn't
-- running or paused, or the winner isn't its only player still in.
create or replace function public.finish_tournament_clock(
  p_clock_id uuid,
  p_winner_id uuid,
  p_finished_at timestamptz,
  p_level_index int,
  p_remaining_ms int
)
returns public._tournament_clocks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clock public._tournament_clocks;
begin
  update public._tournament_clocks
     set status = 'finished',
         level_index = p_level_index,
         level_started_at = null,
         paused_remaining_ms = p_remaining_ms
   where id = p_clock_id and status in ('running', 'paused')
  returning * into v_clock;

  if not found then
    raise exception 'This clock is already finished, not started, or gone.'
      using errcode = 'no_data_found';
  end if;

  update public._clock_entrants e
     set busted_at = p_finished_at, finish_place = 1
   where e.id = p_winner_id
     and e.clock_id = p_clock_id
     and e.busted_at is null
     and not exists (
       select 1 from public._clock_entrants other
        where other.clock_id = p_clock_id
          and other.busted_at is null
          and other.id <> p_winner_id
     );

  if not found then
    raise exception 'More than one player is still in, or the players changed.'
      using errcode = 'no_data_found';
  end if;

  return v_clock;
end;
$$;

-- Undoes a finish pressed by mistake: the clock goes back to paused with
-- the time it had left, and the winner is back in. Only before its results
-- are saved (tournament_id is null).
create or replace function public.reopen_tournament_clock(p_clock_id uuid)
returns public._tournament_clocks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clock public._tournament_clocks;
begin
  update public._tournament_clocks
     set status = 'paused',
         level_started_at = null,
         paused_remaining_ms = coalesce(paused_remaining_ms, 0)
   where id = p_clock_id and status = 'finished' and tournament_id is null
  returning * into v_clock;

  if not found then
    raise exception 'This clock isn''t finished, or its results are saved.'
      using errcode = 'no_data_found';
  end if;

  update public._clock_entrants
     set busted_at = null, finish_place = null
   where clock_id = p_clock_id and finish_place = 1;

  return v_clock;
end;
$$;

-- Saves a finished clock's results as a tournament and its members'
-- sessions, and links the clock to it. Saving again updates that tournament
-- and replaces its sessions, so results can be corrected from the clock.
-- p_tournament: { name, date, week_id, places_paid, buy_in_amount,
-- rebuy_amount, player_count, total_rebuys }. p_sessions: an array of
-- { member_id, rebuys, cash_out, place }. Returns the tournament id.
create or replace function public.save_clock_results(
  p_clock_id uuid,
  p_tournament jsonb,
  p_sessions jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_clock public._tournament_clocks;
  v_tournament_id uuid;
begin
  select * into v_clock
    from public._tournament_clocks
   where id = p_clock_id and status = 'finished'
     for update;

  if not found then
    raise exception 'This clock isn''t finished or no longer exists.'
      using errcode = 'no_data_found';
  end if;

  if v_clock.tournament_id is null then
    insert into public._tournaments (
      name, date, week_id, places_paid, buy_in_amount, rebuy_amount,
      player_count, total_rebuys
    )
    values (
      p_tournament->>'name',
      (p_tournament->>'date')::date,
      (p_tournament->>'week_id')::uuid,
      (p_tournament->>'places_paid')::smallint,
      (p_tournament->>'buy_in_amount')::numeric,
      (p_tournament->>'rebuy_amount')::numeric,
      (p_tournament->>'player_count')::int,
      (p_tournament->>'total_rebuys')::int
    )
    returning id into v_tournament_id;

    update public._tournament_clocks
       set tournament_id = v_tournament_id
     where id = p_clock_id;
  else
    update public._tournaments
       set name = p_tournament->>'name',
           date = (p_tournament->>'date')::date,
           week_id = (p_tournament->>'week_id')::uuid,
           places_paid = (p_tournament->>'places_paid')::smallint,
           buy_in_amount = (p_tournament->>'buy_in_amount')::numeric,
           rebuy_amount = (p_tournament->>'rebuy_amount')::numeric,
           player_count = (p_tournament->>'player_count')::int,
           total_rebuys = (p_tournament->>'total_rebuys')::int
     where id = v_clock.tournament_id
    returning id into v_tournament_id;

    delete from public._tournament_sessions
     where tournament_id = v_tournament_id;
  end if;

  insert into public._tournament_sessions (
    tournament_id, member_id, rebuys, cash_out, place
  )
  select v_tournament_id,
         (s->>'member_id')::uuid,
         (s->>'rebuys')::int,
         (s->>'cash_out')::numeric,
         (s->>'place')::smallint
    from jsonb_array_elements(p_sessions) s;

  return v_tournament_id;
end;
$$;

revoke execute on function public.finish_tournament_clock(uuid, uuid, timestamptz, int, int) from public, anon;
grant execute on function public.finish_tournament_clock(uuid, uuid, timestamptz, int, int) to authenticated;
revoke execute on function public.reopen_tournament_clock(uuid) from public, anon;
grant execute on function public.reopen_tournament_clock(uuid) to authenticated;
revoke execute on function public.save_clock_results(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_clock_results(uuid, jsonb, jsonb) to authenticated;
