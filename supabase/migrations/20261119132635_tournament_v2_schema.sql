-- Tournament v2 cutover, step 1: schema, data fixes, points, public read.
-- Plan: docs/plans/2026-11-18-tournament-v2-cutover.md (Task 3).
--
-- After this migration, _tournament_sessions stores only source data
-- (member, tournament, rebuys, cash_out, place). Buy-in and net profit are
-- calculated by _tournament_session_points from the tournament's prices.
-- v1 tables (tournaments, tournament_sessions) are not modified.

-- 1. Guard: v2 sessions must still mirror v1's real sessions, or stop here.
do $$
declare
  mismatches int;
begin
  select count(*) into mismatches
  from public._tournament_sessions v
  full join (select * from public.tournament_sessions where place > 0) o on o.id = v.id
  where v.id is null
     or o.id is null
     or v.member_id <> o.member_id
     or v.tournament_id is distinct from o.tournament_id
     or v.rebuys <> o.rebuys
     or v.cash_out <> o.cash_out
     or v.place <> o.place;

  if mismatches > 0 then
    raise exception 'tournament v2 cutover: % session rows differ between v1 and v2; re-sync before migrating', mismatches;
  end if;
end $$;

-- 2. Tournament prices and totals (totals include guests, who have no sessions).
alter table public._tournaments
  add column buy_in_amount numeric not null default 40 check (buy_in_amount >= 0),
  add column rebuy_amount  numeric not null default 40 check (rebuy_amount >= 0),
  add column player_count  int,
  add column total_rebuys  int;

update public._tournaments t
set player_count = o.player_count,
    total_rebuys = o.rebuys
from public.tournaments o
where o.id = t.id;

-- Approved data fixes (plan Task 2): v1 tournament rebuy totals disagreed with
-- the sessions and payouts.
update public._tournaments set total_rebuys = 4
where id in (
  '0c81197b-51c0-44dc-a4b7-02c8fed47f32',  -- Lake Lizzie Luau 2022 (was 3; payouts total $440)
  '658609d0-4e2b-4de0-ab04-1b6e48be9850'   -- Lake Lizzie Luau 2024 (was 1; pool already $440)
);

alter table public._tournaments
  alter column player_count set not null,
  alter column total_rebuys set not null,
  add constraint tournaments_v2_player_count_check check (player_count >= 0),
  add constraint tournaments_v2_total_rebuys_check check (total_rebuys >= 0);

-- 3. Approved session fixes (plan Task 2).
-- Thanksgiving Showdown 2025, 9th: $120 in with 0 rebuys recorded; 2 rebuys
-- reconciles members' rebuys (9) with the tournament total.
update public._tournament_sessions set rebuys = 2
where id = 'a148d2c3-a6ae-4e8e-924d-2548a1e0a757';

-- Lake Lizzie Luau 2023, 1st: paid $240 against a $440 pool (payouts summed to
-- $460). 1st was $220.
update public._tournament_sessions set cash_out = 220
where id = '9b0501ce-4b7e-46da-9051-a2cc8b7bdc91';

-- (2025 Kindred Open 6th: stored buy-in $40 with 1 rebuy. Now calculated as $80;
--  no stored change needed. Lake Lizzie Luau 2023 2nd: stored net_profit 143
--  typo. Now calculated as $114.)

-- 4. Points for 15th and 16th (matches the app's former in-code table).
insert into public._tournament_place_points (place, poy_points, nlpi_points)
values (15, 15, 1), (16, 10, 1)
on conflict (place) do update
  set poy_points = excluded.poy_points,
      nlpi_points = excluded.nlpi_points;

-- 5. Calculate buy-in and net profit; cap points lookup at 16th.
-- Same column names, types (numeric(10,2) money) and order as before, so
-- dependents keep working.
create or replace view public._tournament_session_points
with (security_invoker = on) as
select
  ts.id,
  ts.member_id,
  ts.tournament_id,
  (t.buy_in_amount + ts.rebuys * t.rebuy_amount)::numeric(10,2)                 as buy_in,
  ts.cash_out,
  (ts.cash_out - (t.buy_in_amount + ts.rebuys * t.rebuy_amount))::numeric(10,2) as net_profit,
  ts.rebuys,
  ts.place,
  t.week_id,
  t.date,
  t.name as tournament_name,
  pp.poy_points,
  pp.nlpi_points
from public._tournament_sessions ts
join public._tournaments t on t.id = ts.tournament_id
left join public._tournament_place_points pp on pp.place = least(ts.place::int, 16);

-- 6. Stored money columns are now redundant. net_profit is a generated column
-- over buy_in, so it goes first.
alter table public._tournament_sessions
  drop column net_profit,
  drop column buy_in;

-- 7. Session constraints. unique(member_id, tournament_id), place >= 1 and
-- tournament_id not null already exist.
alter table public._tournament_sessions
  alter column place set not null,
  drop constraint tournament_sessions_v2_tournament_id_fkey,
  add constraint tournament_sessions_v2_tournament_id_fkey
    foreign key (tournament_id) references public._tournaments(id) on delete cascade;

-- 8. Tournament summary for the app (season via v1 week/season, whose ids
-- match _weeks/_seasons).
create view public._tournament_summaries
with (security_invoker = on) as
select
  t.id,
  t.name,
  t.date,
  t.week_id,
  w.season_id,
  s.year as season_year,
  t.places_paid,
  t.buy_in_amount,
  t.rebuy_amount,
  t.player_count,
  t.total_rebuys,
  t.player_count * t.buy_in_amount + t.total_rebuys * t.rebuy_amount as prize_pool
from public._tournaments t
join public.week w on w.id = t.week_id
join public.season s on s.id = w.season_id;

grant select on public._tournament_summaries to anon, authenticated;

-- 9. Public read, matching v1 tournaments/tournament_sessions. The views are
-- security_invoker, so anon needs read on the underlying v2 tables.
create policy "public read" on public._tournaments
  for select to anon using (true);
create policy "public read" on public._tournament_sessions
  for select to anon using (true);
create policy "public read" on public._tournament_place_points
  for select to anon using (true);
