insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-media',
  'wedding-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.wedding_sites
add column if not exists ceremony_image_url text,
add column if not exists reception_image_url text;

alter table public.wedding_sites
add constraint wedding_sites_ceremony_image_url_length check (ceremony_image_url is null or length(ceremony_image_url) <= 600),
add constraint wedding_sites_reception_image_url_length check (reception_image_url is null or length(reception_image_url) <= 600);

create type public.gift_status as enum ('draft', 'active', 'paused', 'sold_out', 'archived');
create type public.gift_category as enum ('cash', 'home', 'experience', 'travel', 'custom');

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  site_id uuid not null references public.wedding_sites(id) on delete cascade,
  status public.gift_status not null default 'draft',
  category public.gift_category not null default 'custom',
  title text not null,
  description text,
  image_url text,
  amount_cents integer not null,
  quantity_total integer,
  quantity_purchased integer not null default 0,
  allow_partial boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gifts_title_length check (length(title) between 3 and 180),
  constraint gifts_description_length check (description is null or length(description) <= 900),
  constraint gifts_image_url_length check (image_url is null or length(image_url) <= 600),
  constraint gifts_amount_positive check (amount_cents > 0),
  constraint gifts_quantity_total_positive check (quantity_total is null or quantity_total > 0),
  constraint gifts_quantity_purchased_valid check (quantity_purchased >= 0)
);

create index gifts_couple_id_idx on public.gifts(couple_id);
create index gifts_site_id_status_idx on public.gifts(site_id, status);

create trigger gifts_set_updated_at
before update on public.gifts
for each row execute function public.set_updated_at();

alter table public.gifts enable row level security;

create policy "Couple managers can create gifts"
on public.gifts for insert
to authenticated
with check (
  public.can_manage_couple(auth.uid(), couple_id)
  and exists (
    select 1 from public.wedding_sites
    where wedding_sites.id = site_id
      and wedding_sites.couple_id = gifts.couple_id
  )
);

create policy "Couple members can read own gifts"
on public.gifts for select
to authenticated
using (public.is_active_couple_member(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create policy "Guests can read active gifts"
on public.gifts for select
to anon
using (status = 'active');

create policy "Couple managers can update gifts"
on public.gifts for update
to authenticated
using (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()))
with check (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create policy "Couple managers can upload wedding media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'wedding-media'
  and public.can_manage_couple(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

create policy "Couple managers can update wedding media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'wedding-media'
  and public.can_manage_couple(auth.uid(), ((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'wedding-media'
  and public.can_manage_couple(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

create policy "Anyone can read wedding media"
on storage.objects for select
to public
using (bucket_id = 'wedding-media');
