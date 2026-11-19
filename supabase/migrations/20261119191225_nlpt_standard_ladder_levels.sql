-- Tournament clock: rebuild NLPT Standard's levels on the round big blind
-- ladder the editor suggests (1, 1.5, 2, 3, 4, 5, 6, 8 x each power of ten).
-- Still 16 levels of 20 minutes with 10-minute breaks after levels 4, 8 and
-- 12: 19 rows, 5h 50m. Replaces the rows from
-- 20261119163628_tournament_clock_starter_structure.
-- Does nothing if the template doesn't exist.

delete from public._blind_levels l
using public._blind_structures s
where s.id = l.structure_id
  and s.name = 'NLPT Standard';

insert into public._blind_levels (structure_id, position, kind, small_blind, big_blind, ante, duration_seconds)
select s.id, l.position, l.kind, l.small_blind, l.big_blind, 0, l.duration_seconds
from public._blind_structures s
cross join (values
  ( 1, 'level',  100,   200, 1200),
  ( 2, 'level',  150,   300, 1200),
  ( 3, 'level',  200,   400, 1200),
  ( 4, 'level',  250,   500, 1200),
  ( 5, 'break', null,  null,  600),
  ( 6, 'level',  300,   600, 1200),
  ( 7, 'level',  400,   800, 1200),
  ( 8, 'level',  500,  1000, 1200),
  ( 9, 'level',  750,  1500, 1200),
  (10, 'break', null,  null,  600),
  (11, 'level', 1000,  2000, 1200),
  (12, 'level', 1500,  3000, 1200),
  (13, 'level', 2000,  4000, 1200),
  (14, 'level', 2500,  5000, 1200),
  (15, 'break', null,  null,  600),
  (16, 'level', 3000,  6000, 1200),
  (17, 'level', 4000,  8000, 1200),
  (18, 'level', 5000, 10000, 1200),
  (19, 'level', 7500, 15000, 1200)
) as l(position, kind, small_blind, big_blind, duration_seconds)
where s.name = 'NLPT Standard';
