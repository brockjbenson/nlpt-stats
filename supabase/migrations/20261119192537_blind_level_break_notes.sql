-- Tournament clock: an optional note on a break ("Color up the 25s",
-- "Dinner"). Breaks only, 1-100 characters after trimming. Clocks copy it
-- in their levels snapshot like the other level fields.

alter table public._blind_levels
  add column note text,
  add constraint blind_levels_note_check check (
    note is null
    or (kind = 'break' and btrim(note) <> '' and char_length(note) <= 100)
  );

-- save_blind_structure: also store each level's note (blank becomes null).
create or replace function public.save_blind_structure(
  p_id uuid,
  p_structure jsonb,
  p_levels jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_payout_pcts numeric[] := array(
    select jsonb_array_elements_text(p_structure -> 'default_payout_pcts')::numeric
  );
begin
  if jsonb_typeof(p_levels) is distinct from 'array' or jsonb_array_length(p_levels) = 0 then
    raise exception 'a blind structure needs at least one level'
      using errcode = 'check_violation';
  end if;

  if p_id is null then
    insert into public._blind_structures (
      name, default_buy_in, default_rebuy, default_starting_chips,
      default_rebuy_chips, default_places_paid, default_payout_pcts,
      default_max_rebuys
    )
    values (
      p_structure ->> 'name',
      (p_structure ->> 'default_buy_in')::numeric,
      (p_structure ->> 'default_rebuy')::numeric,
      (p_structure ->> 'default_starting_chips')::int,
      (p_structure ->> 'default_rebuy_chips')::int,
      (p_structure ->> 'default_places_paid')::int,
      v_payout_pcts,
      (p_structure ->> 'default_max_rebuys')::int
    )
    returning id into v_id;
  else
    update public._blind_structures
    set name                   = p_structure ->> 'name',
        default_buy_in         = (p_structure ->> 'default_buy_in')::numeric,
        default_rebuy          = (p_structure ->> 'default_rebuy')::numeric,
        default_starting_chips = (p_structure ->> 'default_starting_chips')::int,
        default_rebuy_chips    = (p_structure ->> 'default_rebuy_chips')::int,
        default_places_paid    = (p_structure ->> 'default_places_paid')::int,
        default_payout_pcts    = v_payout_pcts,
        default_max_rebuys     = (p_structure ->> 'default_max_rebuys')::int
    where id = p_id
    returning id into v_id;

    -- Missing, or hidden from this user by RLS.
    if v_id is null then
      raise exception 'blind structure % not found', p_id
        using errcode = 'no_data_found';
    end if;
  end if;

  delete from public._blind_levels where structure_id = v_id;

  insert into public._blind_levels (
    structure_id, position, kind, small_blind, big_blind, ante, duration_seconds, note
  )
  select
    v_id,
    l.position,
    l.level ->> 'kind',
    (l.level ->> 'small_blind')::int,
    (l.level ->> 'big_blind')::int,
    coalesce((l.level ->> 'ante')::int, 0),
    (l.level ->> 'duration_seconds')::int,
    nullif(btrim(l.level ->> 'note'), '')
  from jsonb_array_elements(p_levels) with ordinality as l(level, position);

  return v_id;
end;
$$;
