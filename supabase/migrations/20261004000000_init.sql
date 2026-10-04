create extension if not exists supabase_vault with schema vault;

-- Rule sets and their rules ---------------------------------------------

create type public.rule_type as enum ('noul', 'score');

create table public.rule_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rule_sets_user_id_idx on public.rule_sets (user_id);

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null references public.rule_sets (id) on delete cascade,
  type public.rule_type not null,
  text text not null check (char_length(btrim(text)) between 1 and 500),
  position integer not null
);
create index rules_rule_set_id_position_idx on public.rules (rule_set_id, position);

alter table public.rule_sets enable row level security;
alter table public.rules enable row level security;

create policy "Owners manage their rule sets" on public.rule_sets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage rules in their rule sets" on public.rules
  for all to authenticated
  using (exists (
    select 1 from public.rule_sets s
    where s.id = rule_set_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.rule_sets s
    where s.id = rule_set_id and s.user_id = (select auth.uid())
  ));

-- Creates or updates a rule set and replaces its rules in one transaction.
-- Runs as the caller, so row level security decides what they may touch.
create function public.save_rule_set(p_id uuid, p_name text, p_rules jsonb)
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
  if jsonb_array_length(p_rules) > 30 then
    raise exception 'too_many_rules';
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

  insert into public.rules (rule_set_id, type, text, position)
  select v_id, (r ->> 'type')::public.rule_type, btrim(r ->> 'text'), ord::integer
  from jsonb_array_elements(p_rules) with ordinality as t (r, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_rule_set(uuid, text, jsonb) from public, anon;
grant execute on function public.save_rule_set(uuid, text, jsonb) to authenticated;

-- TypeSafe API keys -------------------------------------------------------
-- The key itself is a Vault secret. This table only links a user to that
-- secret and keeps the last four characters for display. It has no policies:
-- only the server, using the secret key, can reach it.

create table public.user_api_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret_id uuid not null,
  last4 text not null,
  updated_at timestamptz not null default now()
);
alter table public.user_api_keys enable row level security;
revoke all on public.user_api_keys from anon, authenticated;

create function public.set_typesafe_key(p_user_id uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
begin
  select secret_id into v_secret_id from public.user_api_keys where user_id = p_user_id;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_key, 'typesafe_key_' || p_user_id::text);
    insert into public.user_api_keys (user_id, secret_id, last4)
    values (p_user_id, v_secret_id, right(p_key, 4));
  else
    perform vault.update_secret(v_secret_id, p_key);
    update public.user_api_keys
      set last4 = right(p_key, 4), updated_at = now()
      where user_id = p_user_id;
  end if;
end;
$$;

create function public.get_typesafe_key(p_user_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select d.decrypted_secret
  from public.user_api_keys k
  join vault.decrypted_secrets d on d.id = k.secret_id
  where k.user_id = p_user_id;
$$;

create function public.delete_typesafe_key(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.user_api_keys where user_id = p_user_id;
$$;

-- Removing the row (directly, or by deleting the account) removes the secret.
create function public.delete_typesafe_key_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end;
$$;

create trigger user_api_keys_delete_secret
  after delete on public.user_api_keys
  for each row execute function public.delete_typesafe_key_secret();

revoke execute on function public.set_typesafe_key(uuid, text) from public, anon, authenticated;
revoke execute on function public.get_typesafe_key(uuid) from public, anon, authenticated;
revoke execute on function public.delete_typesafe_key(uuid) from public, anon, authenticated;
revoke execute on function public.delete_typesafe_key_secret() from public, anon, authenticated;
grant execute on function public.set_typesafe_key(uuid, text) to service_role;
grant execute on function public.get_typesafe_key(uuid) to service_role;
grant execute on function public.delete_typesafe_key(uuid) to service_role;
