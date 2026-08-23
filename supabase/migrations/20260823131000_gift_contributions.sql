do $$
begin
  create type public.gift_contribution_status as enum ('pending', 'approved', 'cancelled', 'refunded');
exception
  when duplicate_object then null;
end $$;

alter table public.gifts
add column if not exists amount_contributed_cents integer not null default 0;

alter table public.profiles
add column if not exists pix_key text;

do $$
begin
  alter table public.gifts
  add constraint gifts_amount_contributed_non_negative check (amount_contributed_cents >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
  add constraint profiles_pix_key_length check (pix_key is null or length(pix_key) <= 77);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.gift_contributions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  site_id uuid not null references public.wedding_sites(id) on delete cascade,
  gift_id uuid not null references public.gifts(id) on delete cascade,
  contributor_name text not null,
  contributor_email text,
  amount_cents integer not null,
  message text,
  status public.gift_contribution_status not null default 'approved',
  payment_provider text not null default 'mock',
  provider_reference text,
  pix_key_snapshot text,
  pix_payload text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_contributions_name_length check (length(contributor_name) between 3 and 160),
  constraint gift_contributions_email_length check (contributor_email is null or length(contributor_email) <= 220),
  constraint gift_contributions_message_length check (message is null or length(message) <= 500),
  constraint gift_contributions_pix_key_snapshot_length check (pix_key_snapshot is null or length(pix_key_snapshot) <= 77),
  constraint gift_contributions_pix_payload_length check (pix_payload is null or length(pix_payload) <= 1200),
  constraint gift_contributions_amount_positive check (amount_cents > 0)
);

create index if not exists gift_contributions_couple_id_idx on public.gift_contributions(couple_id);
create index if not exists gift_contributions_site_id_idx on public.gift_contributions(site_id);
create index if not exists gift_contributions_gift_id_idx on public.gift_contributions(gift_id);

drop trigger if exists gift_contributions_set_updated_at on public.gift_contributions;
create trigger gift_contributions_set_updated_at
before update on public.gift_contributions
for each row execute function public.set_updated_at();

alter table public.gift_contributions enable row level security;

drop policy if exists "Guests can read active gifts" on public.gifts;
drop policy if exists "Guests can read available and unavailable public gifts" on public.gifts;
create policy "Guests can read available and unavailable public gifts"
on public.gifts for select
to anon, authenticated
using (
  status in ('active', 'sold_out')
  and exists (
    select 1
    from public.wedding_sites
    where wedding_sites.id = gifts.site_id
      and wedding_sites.status = 'published'
  )
);

drop policy if exists "Couple members can read own gift contributions" on public.gift_contributions;
create policy "Couple members can read own gift contributions"
on public.gift_contributions for select
to authenticated
using (public.is_active_couple_member(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create or replace function public.get_public_wedding_payment_profile(p_site_id uuid)
returns table (
  pix_key text,
  merchant_name text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.pix_key,
    coalesce(couples.display_name, 'EverAfter') as merchant_name
  from public.wedding_sites
  inner join public.couples
    on couples.id = wedding_sites.couple_id
  inner join public.profiles
    on profiles.id = couples.created_by
  where wedding_sites.id = p_site_id
    and wedding_sites.status = 'published'
    and profiles.pix_key is not null
    and length(trim(profiles.pix_key)) > 0
  limit 1;
$$;

grant execute on function public.get_public_wedding_payment_profile(uuid) to anon, authenticated;

create or replace function public.present_wedding_gift(
  p_gift_id uuid,
  p_contributor_name text,
  p_contributor_email text,
  p_amount_cents integer,
  p_message text,
  p_pix_payload text,
  p_pix_key_snapshot text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_gift public.gifts%rowtype;
  target_cents integer;
  remaining_cents integer;
  new_amount_cents integer;
  contribution_id uuid;
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor inválido.';
  end if;

  if length(trim(coalesce(p_contributor_name, ''))) < 3 then
    raise exception 'Nome inválido.';
  end if;

  select gifts.*
    into target_gift
  from public.gifts
  inner join public.wedding_sites
    on wedding_sites.id = gifts.site_id
  where gifts.id = p_gift_id
    and wedding_sites.status = 'published'
  for update of gifts;

  if not found or target_gift.status <> 'active' then
    raise exception 'Presente indisponível.';
  end if;

  if not exists (
    select 1
    from public.couples
    inner join public.profiles
      on profiles.id = couples.created_by
    where couples.id = target_gift.couple_id
      and profiles.pix_key is not null
      and length(trim(profiles.pix_key)) > 0
  ) then
    raise exception 'Chave Pix indisponível.';
  end if;

  if length(trim(coalesce(p_pix_payload, ''))) = 0 or length(trim(coalesce(p_pix_key_snapshot, ''))) = 0 then
    raise exception 'Payload Pix inválido.';
  end if;

  if not exists (
    select 1
    from public.couples
    inner join public.profiles
      on profiles.id = couples.created_by
    where couples.id = target_gift.couple_id
      and profiles.pix_key = p_pix_key_snapshot
  ) then
    raise exception 'Chave Pix inválida.';
  end if;

  target_cents := target_gift.amount_cents * coalesce(target_gift.quantity_total, 1);
  remaining_cents := target_cents - target_gift.amount_contributed_cents;

  if remaining_cents <= 0 then
    update public.gifts
    set status = 'sold_out',
        quantity_purchased = coalesce(quantity_total, 1)
    where id = target_gift.id;

    raise exception 'Presente indisponível.';
  end if;

  if not target_gift.allow_partial and p_amount_cents <> least(target_gift.amount_cents, remaining_cents) then
    raise exception 'Este presente não aceita pagamento parcial.';
  end if;

  if p_amount_cents > remaining_cents then
    raise exception 'Valor maior que o saldo disponível.';
  end if;

  insert into public.gift_contributions (
    couple_id,
    site_id,
    gift_id,
    contributor_name,
    contributor_email,
    amount_cents,
    message,
    status,
    payment_provider,
    provider_reference,
    pix_key_snapshot,
    pix_payload
  )
  values (
    target_gift.couple_id,
    target_gift.site_id,
    target_gift.id,
    trim(p_contributor_name),
    nullif(trim(coalesce(p_contributor_email, '')), ''),
    p_amount_cents,
    nullif(trim(coalesce(p_message, '')), ''),
    'approved',
    'mock',
    'mock-' || gen_random_uuid()::text,
    p_pix_key_snapshot,
    p_pix_payload
  )
  returning id into contribution_id;

  new_amount_cents := target_gift.amount_contributed_cents + p_amount_cents;

  update public.gifts
  set amount_contributed_cents = new_amount_cents,
      quantity_purchased = least(
        coalesce(quantity_total, 1),
        floor(new_amount_cents::numeric / amount_cents)::integer
      ),
      status = case
        when new_amount_cents >= target_cents then 'sold_out'::public.gift_status
        else status
      end
  where id = target_gift.id;

  return contribution_id;
end;
$$;

revoke all on function public.get_public_wedding_payment_profile(uuid) from public;
grant execute on function public.get_public_wedding_payment_profile(uuid) to anon, authenticated;

revoke all on function public.present_wedding_gift(uuid, text, text, integer, text, text, text) from public;
grant execute on function public.present_wedding_gift(uuid, text, text, integer, text, text, text) to anon, authenticated;
