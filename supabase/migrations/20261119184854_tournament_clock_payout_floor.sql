-- Tournament clock: undo 20261119184820_tournament_clock_money_back.
-- Every paid place keeps a straight percentage of the pool (one per paid
-- place, adding up to 100). The buy-in is only a minimum for the last paid
-- place: when its share would be less, it gets the buy-in and the places
-- above give up the difference in proportion. That minimum depends on the
-- pool, so the app applies it (computePayouts), not a table check.

create or replace function private.payout_pcts_valid(pcts numeric[], places_paid int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(pcts, 1), 0) = places_paid
     and not exists (select 1 from unnest(pcts) p where p is null or p <= 0)
     and (select sum(p) from unnest(pcts) p) = 100;
$$;

alter table public._blind_structures
  alter column default_payout_pcts set default '{45,30,15,10}';

update public._blind_structures
set default_payout_pcts = '{45,30,15,10}'
where default_places_paid = 4
  and default_payout_pcts = '{55,30,15}';

-- Replacing the function doesn't recheck existing rows, so check them here.
do $$
begin
  if exists (
    select 1 from public._blind_structures
    where not private.payout_pcts_valid(default_payout_pcts, default_places_paid)
  ) or exists (
    select 1 from public._tournament_clocks
    where not private.payout_pcts_valid(payout_pcts, places_paid)
  ) then
    raise exception 'payout floor: some payout splits no longer fit; fix them before migrating';
  end if;
end $$;
