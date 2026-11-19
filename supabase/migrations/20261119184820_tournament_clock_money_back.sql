-- Tournament clock: the last paid place gets the buy-in back.
-- The last paid place always receives exactly the clock's buy-in; the places
-- above it split the rest of the pool by percentage. So payout percentages
-- cover places 1..N-1 only (one fewer than places paid), each above zero,
-- adding up to 100.

create or replace function private.payout_pcts_valid(pcts numeric[], places_paid int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(pcts, 1), 0) = places_paid - 1
     and not exists (select 1 from unnest(pcts) p where p is null or p <= 0)
     and (select sum(p) from unnest(pcts) p) = 100;
$$;

-- New default: 4 paid at 55 / 30 / 15, 4th gets the buy-in back.
alter table public._blind_structures
  alter column default_payout_pcts set default '{55,30,15}';

update public._blind_structures
set default_payout_pcts = '{55,30,15}'
where default_places_paid = 4
  and default_payout_pcts = '{45,30,15,10}';

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
    raise exception 'money back: some payout splits no longer fit; fix them before migrating';
  end if;
end $$;
