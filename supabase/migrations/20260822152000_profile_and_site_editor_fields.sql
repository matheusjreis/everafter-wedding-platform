alter table public.profiles
add column if not exists avatar_url text;

alter table public.wedding_sites
add column if not exists hero_image_url text,
add column if not exists story text,
add column if not exists ceremony_location text,
add column if not exists reception_location text,
add column if not exists rsvp_note text,
add column if not exists gift_note text;

alter table public.profiles
add constraint profiles_avatar_url_length check (avatar_url is null or length(avatar_url) <= 600);

alter table public.wedding_sites
add constraint wedding_sites_hero_image_url_length check (hero_image_url is null or length(hero_image_url) <= 600),
add constraint wedding_sites_story_length check (story is null or length(story) <= 2800),
add constraint wedding_sites_ceremony_location_length check (ceremony_location is null or length(ceremony_location) <= 220),
add constraint wedding_sites_reception_location_length check (reception_location is null or length(reception_location) <= 220),
add constraint wedding_sites_rsvp_note_length check (rsvp_note is null or length(rsvp_note) <= 600),
add constraint wedding_sites_gift_note_length check (gift_note is null or length(gift_note) <= 600);
