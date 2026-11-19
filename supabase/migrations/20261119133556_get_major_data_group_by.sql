-- Tournament v2 cutover, step 2b: get_major_data grouped by t.id only, relying
-- on tournaments' primary key to select t's other columns. _legacy_tournaments
-- is a view (no primary key), so list the selected columns explicitly.
-- Plan: docs/plans/2026-11-18-tournament-v2-cutover.md (Task 4).
do $$
declare
  def text := pg_get_functiondef('public.get_major_data(uuid)'::regprocedure);
  old_clause constant text := 'GROUP BY t.id, s.year';
  new_clause constant text :=
    'GROUP BY t.id, t.name, t.money_in_play, t.buy_ins, t.rebuys, t.player_count, t.places_payed, t.date, s.year';
begin
  if (length(def) - length(replace(def, old_clause, ''))) / length(old_clause) <> 1 then
    raise exception 'get_major_data: expected exactly one "%"', old_clause;
  end if;
  execute replace(def, old_clause, new_clause);
end $$;
