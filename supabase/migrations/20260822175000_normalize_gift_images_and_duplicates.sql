update public.gifts
set image_url = case
  when lower(title) like '%eletro%' or lower(title) like '%cozinha%' then '/images/defaults/gift-kitchen-appliance.png'
  when lower(title) like '%passagem%' or lower(title) like '%lua de mel%' then '/images/defaults/gift-honeymoon-travel.png'
  when lower(title) like '%café%' or lower(title) like '%cafe%' then '/images/defaults/gift-breakfast.png'
  when lower(title) like '%spa%' then '/images/defaults/gift-spa-day.png'
  when lower(title) like '%jogo de jantar%' or lower(title) like '%mesa%' then '/images/defaults/gift-tableware.png'
  when lower(title) like '%jantar%' then '/images/defaults/gift-romantic-dinner.png'
  when category = 'home' then '/images/defaults/gift-new-home.png'
  when category = 'travel' then '/images/defaults/gift-honeymoon-travel.png'
  else image_url
end
where image_url is null
  or image_url = ''
  or image_url = '/images/defaults/gift-symbolic-default.png';

with ranked_gifts as (
  select
    id,
    row_number() over (
      partition by site_id, lower(trim(title))
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.gifts
  where status <> 'archived'
)
update public.gifts
set status = 'archived'
from ranked_gifts
where gifts.id = ranked_gifts.id
  and ranked_gifts.duplicate_rank > 1;
