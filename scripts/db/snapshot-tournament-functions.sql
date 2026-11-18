-- Fingerprints the output of every tournament-reading RPC the app calls.
-- Read-only (plain SELECT), so it runs on the read-only prod MCP too.
--
-- One row per call: fn, args, row_count, hash. The hash is order-independent
-- (rows sorted by their text form before hashing), so a function returning
-- the same rows in a different order still matches.
--
-- Argument domains mirror how the app calls each function
-- (lib/data/league.ts, app/(home)/compare, app/admin/stats/tournaments/[id]):
--   get_career_data(member, season)        every member x every season
--   get_career_stats(view, season)         cash|tournament|cumulative x (every season id + 'career')
--   get_major_data(tournament)             every tournament
--   get_nlpi_info(season, null)            every season            (NLPI page)
--   get_nlpi_info(season, null, member)    every season x member   (member page)
--   get_poy_info(season, member|null)      every season x (null + every member)
--   get_poy_records()                      once
--
-- Ids are read from v1 season / members / tournaments. The v2 tables share
-- these ids, so the same query works before and after the cutover.

with calls as (
  select 'get_career_data' as fn,
         jsonb_build_object('target_member_id', m.id, 'current_season_id', s.id) as args,
         x.row_count, x.hash
  from public.season s
  cross join public.members m
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_career_data(m.id, s.id) r
  ) x

  union all
  select 'get_career_stats',
         jsonb_build_object('target_view', v.view, 'target_season', ss.season),
         x.row_count, x.hash
  from (values ('cash'), ('tournament'), ('cumulative')) v(view)
  cross join (select id::text as season from public.season union all select 'career') ss
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_career_stats(v.view, ss.season) r
  ) x

  union all
  select 'get_major_data',
         jsonb_build_object('target_tournament_id', t.id),
         x.row_count, x.hash
  from public.tournaments t
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_major_data(t.id) r
  ) x

  union all
  select 'get_nlpi_info/2',
         jsonb_build_object('current_season_id', s.id, 'target_filter_date', null),
         x.row_count, x.hash
  from public.season s
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_nlpi_info(s.id, null::date) r
  ) x

  union all
  select 'get_nlpi_info/3',
         jsonb_build_object('current_season_id', s.id, 'target_filter_date', null, 'target_member_id', m.id),
         x.row_count, x.hash
  from public.season s
  cross join public.members m
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_nlpi_info(s.id, null::date, m.id) r
  ) x

  union all
  select 'get_poy_info',
         jsonb_build_object('current_season_id', s.id, 'target_member_id', mm.id),
         x.row_count, x.hash
  from public.season s
  cross join (select null::uuid as id union all select id from public.members) mm
  cross join lateral (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_poy_info(s.id, mm.id) r
  ) x

  union all
  select 'get_poy_records', '{}'::jsonb, x.row_count, x.hash
  from (
    select count(*) as row_count, md5(string_agg(r::text, '|' order by r::text)) as hash
    from public.get_poy_records() r
  ) x
)
-- One compact line per call: "<fn> <args> <row_count> <hash12>".
-- Args are the argument values in key order, uuids shortened to 8 chars
-- (unique for this league's members/seasons/tournaments).
, lines as (
  select fn
         || ' ' || coalesce(
              (select string_agg(coalesce(left(a.value #>> '{}', 8), 'null'), ',' order by a.key)
               from jsonb_each(args) a),
              '-')
         || ' ' || row_count
         || ' ' || coalesce(left(hash, 12), 'empty') as line
  from calls
)
select count(*) as calls, string_agg(line, E'\n' order by line) as snapshot
from lines;
