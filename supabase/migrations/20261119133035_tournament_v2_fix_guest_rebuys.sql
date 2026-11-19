-- Tournament v2 cutover: correct rebuy totals that left out guests' rebuys.
-- Plan: docs/plans/2026-11-18-tournament-v2-cutover.md (Task 2 decisions).
-- Both pools are confirmed by the payouts; with 5 rebuys, prize_pool equals
-- the v1 money_in_play the site already shows.

-- The Horace Hoedown: payouts total $640 = 11 players + 5 rebuys (was 7).
-- Thanksgiving Showdown (2024): member payouts are 45/30/15% of $560
-- = 9 players + 5 rebuys (was 4; the guest's rebuy was not counted).
update public._tournaments set total_rebuys = 5
where id in (
  'ecdbdad9-696e-4e51-b289-01fab1a6030c',  -- The Horace Hoedown
  '56795f24-93d8-4393-9a70-e03ce9f75501'   -- Thanksgiving Showdown (2024)
);
