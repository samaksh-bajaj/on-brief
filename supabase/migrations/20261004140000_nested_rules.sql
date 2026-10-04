-- Rules can nest: a rule may have sub-rules, which may have their own.
-- Every rule is yes-or-no from here on. The `type` column stays for now so
-- the app version that is already deployed keeps working; a later migration
-- drops it.

alter table public.rules add column parent_id uuid;
create index rules_parent_id_idx on public.rules (parent_id);

-- A sub-rule must belong to the same rule set as its parent
alter table public.rules
  add constraint rules_rule_set_id_id_key unique (rule_set_id, id);
alter table public.rules
  add constraint rules_parent_fkey
  foreign key (rule_set_id, parent_id)
  references public.rules (rule_set_id, id)
  on delete cascade;

update public.rules set type = 'noul' where type <> 'noul';
alter table public.rules alter column type set default 'noul';

-- Inserts a list of rules and, recursively, their sub-rules. Returns how many
-- rules it inserted. Runs as the caller, so row level security applies.
create function public.insert_rules(
  p_rule_set_id uuid,
  p_parent_id uuid,
  p_rules jsonb,
  p_depth integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rule jsonb;
  v_position bigint;
  v_id uuid;
  v_count integer := 0;
begin
  if p_rules is null or jsonb_typeof(p_rules) = 'null' then
    return 0;
  end if;
  if jsonb_typeof(p_rules) <> 'array' then
    raise exception 'rules_invalid';
  end if;
  if jsonb_array_length(p_rules) = 0 then
    return 0;
  end if;
  if p_depth > 4 then
    raise exception 'too_deep';
  end if;

  for v_rule, v_position in
    select r, ord from jsonb_array_elements(p_rules) with ordinality as t (r, ord)
  loop
    insert into public.rules (rule_set_id, parent_id, text, position)
    values (p_rule_set_id, p_parent_id, btrim(v_rule ->> 'text'), v_position::integer)
    returning id into v_id;

    v_count := v_count + 1
      + public.insert_rules(p_rule_set_id, v_id, v_rule -> 'children', p_depth + 1);
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.insert_rules(uuid, uuid, jsonb, integer) from public, anon;
grant execute on function public.insert_rules(uuid, uuid, jsonb, integer) to authenticated;

-- p_rules is now a tree: [{ "text": "...", "children": [ ... ] }]. A flat
-- list without "children" still works, and any "type" sent is ignored.
create or replace function public.save_rule_set(p_id uuid, p_name text, p_rules jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_rules) is distinct from 'array' then
    raise exception 'rules_invalid';
  end if;

  if p_id is null then
    insert into public.rule_sets (name) values (btrim(p_name)) returning id into v_id;
  else
    update public.rule_sets
      set name = btrim(p_name), updated_at = now()
      where id = p_id
      returning id into v_id;
    if v_id is null then
      raise exception 'not_found';
    end if;
    delete from public.rules where rule_set_id = v_id;
  end if;

  if public.insert_rules(v_id, null, p_rules, 1) > 60 then
    raise exception 'too_many_rules';
  end if;

  return v_id;
end;
$$;
