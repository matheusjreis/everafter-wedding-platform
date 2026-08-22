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
  new_site_id uuid := gen_random_uuid();
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

  insert into public.wedding_sites (
    id,
    couple_id,
    slug,
    title,
    wedding_date,
    description,
    hero_image_url,
    story,
    ceremony_location,
    reception_location,
    ceremony_image_url,
    reception_image_url,
    rsvp_note,
    gift_note
  )
  values (
    new_site_id,
    new_couple_id,
    site_slug,
    site_title,
    site_wedding_date,
    'Estamos preparando cada detalhe para celebrar esse dia com as pessoas que amamos.',
    '/images/defaults/wedding-hero-default.png',
    'Nossa história ainda está sendo escrita aqui. Em breve vamos compartilhar os momentos, memórias e detalhes que tornam esse casamento especial.',
    'Local da cerimônia',
    'Local da recepção',
    '/images/defaults/ceremony-chapel-default.png',
    '/images/defaults/reception-hall-default.png',
    'Confirme sua presença para nos ajudar a organizar esse dia com carinho.',
    'Escolha um presente simbólico ou contribua com uma experiência especial para o casal.'
  );

  insert into public.gifts (
    couple_id,
    site_id,
    title,
    description,
    image_url,
    amount_cents,
    category,
    status,
    allow_partial,
    sort_order
  )
  values
    (
      new_couple_id,
      new_site_id,
      'Cota para a lua de mel',
      'Ajude o casal a viver dias inesquecíveis na primeira viagem depois do casamento.',
      '/images/defaults/gift-honeymoon-travel.png',
      30000,
      'travel',
      'active',
      true,
      10
    ),
    (
      new_couple_id,
      new_site_id,
      'Jantar romântico',
      'Uma noite especial para o casal celebrar a nova fase com calma e carinho.',
      '/images/defaults/gift-romantic-dinner.png',
      25000,
      'experience',
      'active',
      true,
      20
    ),
    (
      new_couple_id,
      new_site_id,
      'Ajuda para a casa nova',
      'Uma contribuição para montar o novo lar com itens essenciais.',
      '/images/defaults/gift-new-home.png',
      20000,
      'home',
      'active',
      true,
      30
    ),
    (
      new_couple_id,
      new_site_id,
      'Eletrodoméstico para a cozinha',
      'Ajude o casal a equipar a cozinha para a rotina do novo lar.',
      '/images/defaults/gift-kitchen-appliance.png',
      35000,
      'home',
      'active',
      true,
      40
    ),
    (
      new_couple_id,
      new_site_id,
      'Jogo de cama especial',
      'Um presente clássico para deixar a casa nova mais aconchegante.',
      '/images/defaults/gift-new-home.png',
      18000,
      'home',
      'active',
      true,
      50
    ),
    (
      new_couple_id,
      new_site_id,
      'Jogo de jantar',
      'Uma contribuição para receber família e amigos em momentos especiais.',
      '/images/defaults/gift-tableware.png',
      28000,
      'home',
      'active',
      true,
      60
    ),
    (
      new_couple_id,
      new_site_id,
      'Café da manhã especial',
      'Um mimo para o casal aproveitar depois da festa ou durante a viagem.',
      '/images/defaults/gift-breakfast.png',
      12000,
      'experience',
      'active',
      true,
      70
    ),
    (
      new_couple_id,
      new_site_id,
      'Dia de spa para o casal',
      'Uma experiência relaxante para recuperar as energias depois da celebração.',
      '/images/defaults/gift-spa-day.png',
      40000,
      'experience',
      'active',
      true,
      80
    ),
    (
      new_couple_id,
      new_site_id,
      'Cota de passagem aérea',
      'Ajude o casal com deslocamentos da lua de mel.',
      '/images/defaults/gift-honeymoon-travel.png',
      50000,
      'travel',
      'active',
      true,
      90
    ),
    (
      new_couple_id,
      new_site_id,
      'Contribuição livre',
      'Uma contribuição simbólica para os planos do casal.',
      '/images/defaults/gift-symbolic-default.png',
      10000,
      'cash',
      'active',
      true,
      100
    );

  return new_couple_id;
end;
$$;

revoke all on function public.create_couple_onboarding(text, text, text, timestamptz) from public;
grant execute on function public.create_couple_onboarding(text, text, text, timestamptz) to authenticated;
