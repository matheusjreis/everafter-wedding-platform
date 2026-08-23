alter table public.profiles
add column if not exists pix_key text;

do $$
begin
  alter table public.profiles
  add constraint profiles_pix_key_length check (pix_key is null or length(pix_key) <= 77);
exception
  when duplicate_object then null;
end $$;

create or replace function public.update_own_profile(
  p_email text,
  p_full_name text,
  p_avatar_url text,
  p_pix_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    pix_key
  )
  values (
    actor_user_id,
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_full_name, '')), ''),
    nullif(trim(coalesce(p_avatar_url, '')), ''),
    nullif(trim(coalesce(p_pix_key, '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        pix_key = excluded.pix_key;
end;
$$;

revoke all on function public.update_own_profile(text, text, text, text) from public;
grant execute on function public.update_own_profile(text, text, text, text) to authenticated;
