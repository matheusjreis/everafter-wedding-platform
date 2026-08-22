create type public.rsvp_attendance_status as enum ('attending', 'declined');

create table public.guest_rsvps (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.wedding_sites(id) on delete cascade,
  guest_name text not null,
  email text,
  phone text,
  attendance_status public.rsvp_attendance_status not null default 'attending',
  guest_count integer not null default 1,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_rsvps_guest_name_length check (length(guest_name) between 3 and 160),
  constraint guest_rsvps_email_length check (email is null or length(email) <= 220),
  constraint guest_rsvps_phone_length check (phone is null or length(phone) <= 40),
  constraint guest_rsvps_guest_count_valid check (guest_count between 1 and 20),
  constraint guest_rsvps_message_length check (message is null or length(message) <= 600)
);

create index guest_rsvps_site_id_created_at_idx on public.guest_rsvps(site_id, created_at desc);
create index guest_rsvps_site_id_attendance_status_idx on public.guest_rsvps(site_id, attendance_status);

create trigger guest_rsvps_set_updated_at
before update on public.guest_rsvps
for each row execute function public.set_updated_at();

alter table public.guest_rsvps enable row level security;

create policy "Guests can confirm attendance on published sites"
on public.guest_rsvps for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.wedding_sites
    where wedding_sites.id = guest_rsvps.site_id
      and wedding_sites.status = 'published'
  )
);

create policy "Couple members can read own RSVPs"
on public.guest_rsvps for select
to authenticated
using (
  exists (
    select 1
    from public.wedding_sites
    where wedding_sites.id = guest_rsvps.site_id
      and (
        public.is_active_couple_member(auth.uid(), wedding_sites.couple_id)
        or public.is_platform_admin(auth.uid())
      )
  )
);
