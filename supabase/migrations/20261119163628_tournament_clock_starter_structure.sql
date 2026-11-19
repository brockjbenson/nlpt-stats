-- Tournament clock, phase 1: the league's starter blind structure.
-- Plan: docs/plans/2026-11-19-tournament-clock-phase-1-schema.md (Task 5).
-- Source: the league's 2026 Thanksgiving Showdown sheet.
--
-- 16 levels of 20 minutes with 10-minute breaks after levels 4, 8 and 12:
-- 19 rows, 5h 50m scheduled. Safe to re-run: if the template already
-- exists, nothing is inserted.

with structure as (
  insert into public._blind_structures (
    name, default_buy_in, default_rebuy, default_starting_chips, default_rebuy_chips,
    default_places_paid, default_payout_pcts, default_max_rebuys
  )
  values ('NLPT Standard', 40, 40, 20000, 20000, 4, '{45,30,15,10}', 2)
  on conflict (name) do nothing
  returning id
)
insert into public._blind_levels (structure_id, position, kind, small_blind, big_blind, ante, duration_seconds)
select structure.id, l.position, l.kind, l.small_blind, l.big_blind, 0, l.duration_seconds
from structure
cross join (values
  ( 1, 'level',   100,   200, 1200),
  ( 2, 'level',   150,   300, 1200),
  ( 3, 'level',   200,   400, 1200),
  ( 4, 'level',   300,   600, 1200),
  ( 5, 'break',  null,  null,  600),
  ( 6, 'level',   400,   800, 1200),
  ( 7, 'level',   500,  1000, 1200),
  ( 8, 'level',   600,  1200, 1200),
  ( 9, 'level',  1000,  2000, 1200),
  (10, 'break',  null,  null,  600),
  (11, 'level',  1500,  3000, 1200),
  (12, 'level',  2000,  4000, 1200),
  (13, 'level',  3000,  6000, 1200),
  (14, 'level',  4000,  8000, 1200),
  (15, 'break',  null,  null,  600),
  (16, 'level',  5000, 10000, 1200),
  (17, 'level',  6000, 12000, 1200),
  (18, 'level',  8000, 16000, 1200),
  (19, 'level', 10000, 20000, 1200)
) as l(position, kind, small_blind, big_blind, duration_seconds);
