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
    coalesce(couples.display_name, profiles.full_name, 'EverAfter') as merchant_name
  from public.wedding_sites
  inner join public.couples
    on couples.id = wedding_sites.couple_id
  inner join public.couple_members
    on couple_members.couple_id = couples.id
  inner join public.profiles
    on profiles.id = couple_members.user_id
  where wedding_sites.id = p_site_id
    and wedding_sites.status = 'published'
    and couple_members.status = 'active'
    and profiles.pix_key is not null
    and length(trim(profiles.pix_key)) > 0
  order by
    case couple_members.role
      when 'owner' then 1
      when 'admin' then 2
      else 3
    end,
    couple_members.created_at asc
  limit 1;
$$;

revoke all on function public.get_public_wedding_payment_profile(uuid) from public;
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
    from public.couple_members
    inner join public.profiles
      on profiles.id = couple_members.user_id
    where couple_members.couple_id = target_gift.couple_id
      and couple_members.status = 'active'
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
    from public.couple_members
    inner join public.profiles
      on profiles.id = couple_members.user_id
    where couple_members.couple_id = target_gift.couple_id
      and couple_members.status = 'active'
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

revoke all on function public.present_wedding_gift(uuid, text, text, integer, text, text, text) from public;
grant execute on function public.present_wedding_gift(uuid, text, text, integer, text, text, text) to anon, authenticated;
