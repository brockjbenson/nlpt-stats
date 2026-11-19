-- Tournament clock: the last paid place's share is set by the player count.
-- Replaces 20261119184854_tournament_clock_payout_floor.
--
-- The last paid place gets 1 / players of the final pool: exactly the
-- buy-in back before rebuys, and more as rebuys grow the pool. The places
-- above split the rest by the payout percentages, which therefore cover
-- places 1..N-1 only (one fewer than places paid), each above zero, adding
-- up to 100. The player count is only known during play, so the app works
-- out the amounts (computePayouts).

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

-- Default: 4 paid, 1st-3rd split 55 / 30 / 15.
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
    raise exception 'last place share: some payout splits no longer fit; fix them before migrating';
  end if;
end $$;
