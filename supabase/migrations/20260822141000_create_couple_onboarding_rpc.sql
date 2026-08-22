create or replace function public.create_couple_onboarding(
  couple_display_name text,
  site_slug text,
  site_title text,
  site_wedding_date timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  new_couple_id uuid := gen_random_uuid();
begin
  if actor_user_id is null then
    raise exception 'Usuário não autenticado.'
      using errcode = '28000';
  end if;

  if exists (
    select 1
    from public.couple_members
    where user_id = actor_user_id
      and status = 'active'
  ) then
    raise exception 'Usuário já possui um casal ativo.'
      using errcode = '23505';
  end if;

  insert into public.couples (id, display_name, created_by)
  values (new_couple_id, couple_display_name, actor_user_id);

  insert into public.couple_members (couple_id, user_id, role, status)
  values (new_couple_id, actor_user_id, 'owner', 'active');

  insert into public.wedding_sites (couple_id, slug, title, wedding_date)
  values (new_couple_id, site_slug, site_title, site_wedding_date);

  return new_couple_id;
end;
$$;

revoke all on function public.create_couple_onboarding(text, text, text, timestamptz) from public;
grant execute on function public.create_couple_onboarding(text, text, text, timestamptz) to authenticated;
