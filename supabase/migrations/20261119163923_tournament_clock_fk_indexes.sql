-- Tournament clock, phase 1: indexes for foreign keys (Supabase performance
-- advisor). Deleting a member, template or tournament checks these columns.

create index clock_entrants_member_id_idx on public._clock_entrants (member_id);
create index tournament_clocks_structure_id_idx on public._tournament_clocks (structure_id);
create index tournament_clocks_tournament_id_idx on public._tournament_clocks (tournament_id);
