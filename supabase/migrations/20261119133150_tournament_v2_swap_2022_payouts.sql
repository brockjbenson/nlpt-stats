-- Tournament v2 cutover: Northern Lights Open 2022 and Winter Invitational 2022
-- had their per-place payouts entered into each other. Approved fix (plan
-- Task 2): swap cash_out by place so each tournament's payouts equal its pool.
--   Northern Lights Open 2022: pool $440 (7 players, 4 rebuys); was paying $520
--   Winter Invitational 2022:  pool $520 (8 players, 5 rebuys); was paying $440
-- Places, members and points are unchanged.
--
-- Each update matches on the old value too, and the block fails unless all 8
-- rows changed, so re-running or running on drifted data is a no-op error.
do $$
declare
  changed int;
begin
  with fix(id, old_cash_out, new_cash_out) as (
    values
      -- Northern Lights Open 2022: takes Winter's 208/112/80/40
      ('92db5da5-f651-414a-a944-c90adfabf2ad'::uuid, 270, 208),  -- 1st
      ('1fb69b02-b408-404a-91d9-24572306e777'::uuid, 140, 112),  -- 2nd
      ('571a9cc2-8346-424d-90c5-be7cf70e4cd2'::uuid,  90,  80),  -- 3rd
      ('225afef1-4784-4b2f-ae67-5436d12c7442'::uuid,  20,  40),  -- 4th
      -- Winter Invitational 2022: takes Northern Lights' 270/140/90/20
      ('38d123c7-da0e-43d8-a850-08a34353e88f'::uuid, 208, 270),  -- 1st
      ('b567280d-15f5-4e39-9819-99a7a0694c1f'::uuid, 112, 140),  -- 2nd
      ('5e993d7e-207c-4cfc-a25b-c89602ae73c3'::uuid,  80,  90),  -- 3rd
      ('0cc18e4d-8aff-418d-962b-8c018900486c'::uuid,  40,  20)   -- 4th
  )
  update public._tournament_sessions s
  set cash_out = f.new_cash_out
  from fix f
  where s.id = f.id and s.cash_out = f.old_cash_out;

  get diagnostics changed = row_count;
  if changed <> 8 then
    raise exception 'expected to swap 8 payouts, changed %', changed;
  end if;
end $$;
