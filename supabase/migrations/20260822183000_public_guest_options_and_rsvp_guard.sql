create or replace function public.get_public_wedding_guest_options(p_site_id uuid)
returns table (
  id uuid,
  guest_name text,
  expected_guest_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    wedding_guests.id,
    wedding_guests.guest_name,
    wedding_guests.expected_guest_count
  from public.wedding_guests
  inner join public.wedding_sites
    on wedding_sites.id = wedding_guests.site_id
  where wedding_guests.site_id = p_site_id
    and wedding_sites.status = 'published'
  order by wedding_guests.guest_name asc;
$$;

grant execute on function public.get_public_wedding_guest_options(uuid) to anon, authenticated;

create or replace function public.is_registered_wedding_guest(p_site_id uuid, p_guest_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wedding_guests
    inner join public.wedding_sites
      on wedding_sites.id = wedding_guests.site_id
    where wedding_guests.site_id = p_site_id
      and lower(wedding_guests.guest_name) = lower(trim(p_guest_name))
      and wedding_sites.status = 'published'
  );
$$;

grant execute on function public.is_registered_wedding_guest(uuid, text) to anon, authenticated;

drop policy if exists "Guests can confirm attendance on published sites" on public.guest_rsvps;

create policy "Registered guests can confirm attendance on published sites"
on public.guest_rsvps for insert
to anon, authenticated
with check (
  public.is_registered_wedding_guest(site_id, guest_name)
);
