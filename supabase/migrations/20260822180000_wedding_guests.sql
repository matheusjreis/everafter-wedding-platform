create table public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  site_id uuid not null references public.wedding_sites(id) on delete cascade,
  guest_name text not null,
  email text,
  phone text,
  group_name text,
  expected_guest_count integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wedding_guests_guest_name_length check (length(guest_name) between 3 and 160),
  constraint wedding_guests_email_length check (email is null or length(email) <= 220),
  constraint wedding_guests_phone_length check (phone is null or length(phone) <= 40),
  constraint wedding_guests_group_name_length check (group_name is null or length(group_name) <= 80),
  constraint wedding_guests_expected_guest_count_valid check (expected_guest_count between 1 and 20),
  constraint wedding_guests_notes_length check (notes is null or length(notes) <= 500),
  constraint wedding_guests_site_guest_unique unique (site_id, guest_name)
);

create index wedding_guests_couple_id_idx on public.wedding_guests(couple_id);
create index wedding_guests_site_id_created_at_idx on public.wedding_guests(site_id, created_at desc);

create trigger wedding_guests_set_updated_at
before update on public.wedding_guests
for each row execute function public.set_updated_at();

alter table public.wedding_guests enable row level security;

create policy "Couple managers can create wedding guests"
on public.wedding_guests for insert
to authenticated
with check (
  public.can_manage_couple(auth.uid(), couple_id)
  and exists (
    select 1
    from public.wedding_sites
    where wedding_sites.id = site_id
      and wedding_sites.couple_id = wedding_guests.couple_id
  )
);

create policy "Couple members can read own wedding guests"
on public.wedding_guests for select
to authenticated
using (public.is_active_couple_member(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create policy "Couple managers can update wedding guests"
on public.wedding_guests for update
to authenticated
using (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()))
with check (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));
