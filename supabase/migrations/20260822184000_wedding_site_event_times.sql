alter table public.wedding_sites
add column if not exists ceremony_time time,
add column if not exists reception_time time;
