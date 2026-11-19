-- Tournament v2 cutover, step 3: drop SQL functions that still read v1
-- tournaments / tournament_sessions and that nothing uses.
-- Plan: docs/plans/2026-11-18-tournament-v2-cutover.md (Task 5).
--
-- The app calls 12 RPCs (get_career_data, get_career_stats, get_major_data,
-- get_member_advanced_skills, get_member_debut_date, get_nlpi_info,
-- get_nlpi_rank_records, get_poy_info, get_poy_records,
-- get_recent_cash_session_info, get_stat_avgs, insert_weekly_nlpi_rankings).
-- None of the functions below are among the overloads it calls, and no
-- function, view, trigger or policy references them. The three overloads of
-- app-called names are the 1-argument versions; the app always passes two.

drop function public.get_best_nlpi_rank();
drop function public.get_career_data(uuid);                    -- app uses (uuid, uuid)
drop function public.get_career_stats(text);                   -- app uses (text, text)
drop function public.get_general_stats(uuid);
drop function public.get_general_stats(uuid, text);
drop function public.get_major_stats(uuid);
drop function public.get_majors_data(integer);
drop function public.get_member_nlpi_data(uuid, uuid);
drop function public.get_nlpi_data();
drop function public.get_nlpi_data(uuid);
drop function public.get_nlpi_info_new(uuid, date, uuid);
drop function public.get_nlpi_info_updated(uuid, date, uuid);
drop function public.get_player_comparison(uuid, uuid);
drop function public.get_poy_data(uuid);
drop function public.get_poy_info(uuid);                       -- app uses (uuid, uuid)
drop function public.get_recent_tournament_sessions();
drop function public.get_season_major_stats(uuid);
drop function public.get_tournament_sessions_by_season(uuid);

-- Nothing in public may still read the v1 tournament tables.
do $$
declare
  remaining text;
begin
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ')
  into remaining
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and pg_get_functiondef(p.oid) ~ '\m(tournaments|tournament_sessions)\M';

  if remaining is not null then
    raise exception 'functions still reference v1 tournament tables: %', remaining;
  end if;
end $$;
