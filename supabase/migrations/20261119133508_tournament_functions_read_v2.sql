-- Tournament v2 cutover, step 2: the stats functions the app calls read v2.
-- Plan: docs/plans/2026-11-18-tournament-v2-cutover.md (Task 4).
--
-- The seven live function signatures were written against v1's
-- tournaments / tournament_sessions. Rather than hand-rewriting ~45KB of SQL,
-- two views reproduce v1's shape (column names and types) from v2 data, and
-- each function's table references are repointed to them. Output stays the
-- same apart from the approved data fixes.

-- v1 stored a 0 row for every member who skipped a tournament ("filler" rows,
-- place 0). The stats depend on it: NLPI's tournament window is the last 4
-- tournaments, and a skipped one counts as 0 (the v2 nlpi_standings applies
-- the same rule). v2 stores only real sessions, so this view adds the 0 rows:
-- one per tournament for each member who had joined by the tournament date
-- and didn't play.
create view public._legacy_tournament_sessions
with (security_invoker = on) as
select
  tp.id,
  tp.buy_in::real       as buy_in,
  tp.cash_out::real     as cash_out,
  tp.rebuys,
  tp.net_profit::real   as net_profit,
  tp.poy_points::real   as poy_points,
  tp.nlpi_points::real  as nlpi_points,
  tp.member_id,
  tp.tournament_id,
  tp.place
from public._tournament_session_points tp
union all
select
  md5(t.id::text || m.id::text)::uuid,  -- stable id for the absent row
  0::real, 0::real, 0, 0::real, 0::real, 0::real,
  m.id,
  t.id,
  0::smallint
from public._tournaments t
cross join public.members m
where (m.join_date is null or m.join_date <= t.date)
  and not exists (
    select 1 from public._tournament_sessions s
    where s.tournament_id = t.id and s.member_id = m.id
  );

-- v1 tournaments' columns, from v2. buy_ins was always equal to player_count.
create view public._legacy_tournaments
with (security_invoker = on) as
select
  s.id,
  s.date,
  s.name,
  s.prize_pool::real   as money_in_play,
  s.player_count       as buy_ins,
  s.total_rebuys       as rebuys,
  s.player_count,
  s.season_id,
  s.places_paid::smallint as places_payed
from public._tournament_summaries s;

grant select on public._legacy_tournament_sessions, public._legacy_tournaments
  to anon, authenticated;

-- Repoint the functions. Each must contain exactly the expected number of
-- references, or nothing changes (guards against a definition that differs
-- from the one this was written against).
do $$
declare
  f record;
  def text;
  ts_hits int;
  t_hits int;
begin
  for f in
    select * from (values
      ('public.get_career_data(uuid,uuid)',    1, 1),
      ('public.get_career_stats(text,text)',   1, 1),
      ('public.get_major_data(uuid)',          1, 1),
      ('public.get_nlpi_info(uuid,date)',      2, 3),
      ('public.get_nlpi_info(uuid,date,uuid)', 2, 3),
      ('public.get_poy_info(uuid,uuid)',       4, 1),
      ('public.get_poy_records()',             5, 4)
    ) v(sig, expected_ts, expected_t)
  loop
    def := pg_get_functiondef(f.sig::regprocedure);
    select count(*) into ts_hits from regexp_matches(def, '\mtournament_sessions\M', 'g');
    select count(*) into t_hits  from regexp_matches(def, '\mtournaments\M', 'g');

    if ts_hits <> f.expected_ts or t_hits <> f.expected_t then
      raise exception '%: expected % tournament_sessions / % tournaments references, found % / %',
        f.sig, f.expected_ts, f.expected_t, ts_hits, t_hits;
    end if;

    def := regexp_replace(def, '\mtournament_sessions\M', '_legacy_tournament_sessions', 'g');
    def := regexp_replace(def, '\mtournaments\M', '_legacy_tournaments', 'g');
    execute def;
  end loop;
end $$;
