create extension if not exists "pgcrypto";

create type public.couple_status as enum ('onboarding', 'active', 'suspended', 'blocked');
create type public.couple_member_role as enum ('owner', 'admin', 'collaborator');
create type public.couple_member_status as enum ('active', 'invited', 'suspended', 'removed');
create type public.site_status as enum ('draft', 'published', 'unpublished', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  status public.couple_status not null default 'onboarding',
  display_name text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couples_display_name_length check (display_name is null or length(display_name) <= 160)
);

create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.couple_member_role not null default 'owner',
  status public.couple_member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create table public.wedding_sites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  slug text not null,
  status public.site_status not null default 'draft',
  title text,
  description text,
  wedding_date timestamptz,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  constraint wedding_sites_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint wedding_sites_title_length check (title is null or length(title) <= 180)
);

create index couple_members_user_id_couple_id_idx on public.couple_members(user_id, couple_id);
create index couple_members_couple_id_status_idx on public.couple_members(couple_id, status);
create index couples_created_by_idx on public.couples(created_by);
create index wedding_sites_couple_id_idx on public.wedding_sites(couple_id);
create index wedding_sites_published_slug_idx on public.wedding_sites(slug) where status = 'published';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger couples_set_updated_at
before update on public.couples
for each row execute function public.set_updated_at();

create trigger couple_members_set_updated_at
before update on public.couple_members
for each row execute function public.set_updated_at();

create trigger wedding_sites_set_updated_at
before update on public.wedding_sites
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_platform_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where platform_admins.user_id = is_platform_admin.user_id
      and active = true
  );
$$;

create or replace function public.is_active_couple_member(user_id uuid, couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_members.user_id = is_active_couple_member.user_id
      and couple_members.couple_id = is_active_couple_member.couple_id
      and couple_members.status = 'active'
  );
$$;

create or replace function public.can_manage_couple(user_id uuid, couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_members.user_id = can_manage_couple.user_id
      and couple_members.couple_id = can_manage_couple.couple_id
      and couple_members.status = 'active'
      and couple_members.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_couple_owner(user_id uuid, couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_members.user_id = is_couple_owner.user_id
      and couple_members.couple_id = is_couple_owner.couple_id
      and couple_members.status = 'active'
      and couple_members.role = 'owner'
  );
$$;

create or replace function public.can_create_initial_owner_membership(
  actor_user_id uuid,
  target_couple_id uuid,
  target_user_id uuid,
  target_role public.couple_member_role,
  target_status public.couple_member_status
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id = actor_user_id
    and target_role = 'owner'
    and target_status = 'active'
    and exists (
      select 1
      from public.couples
      where couples.id = target_couple_id
        and couples.created_by = actor_user_id
    )
    and not exists (
      select 1
      from public.couple_members
      where couple_members.couple_id = target_couple_id
    );
$$;

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.wedding_sites enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_platform_admin(auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Platform admins can read platform admins"
on public.platform_admins for select
to authenticated
using (public.is_platform_admin(auth.uid()));

create policy "Users can create their own couple"
on public.couples for insert
to authenticated
with check (created_by = auth.uid());

create policy "Couple members can read their couples"
on public.couples for select
to authenticated
using (public.is_active_couple_member(auth.uid(), id) or public.is_platform_admin(auth.uid()));

create policy "Couple managers can update their couples"
on public.couples for update
to authenticated
using (public.can_manage_couple(auth.uid(), id) or public.is_platform_admin(auth.uid()))
with check (public.can_manage_couple(auth.uid(), id) or public.is_platform_admin(auth.uid()));

create policy "Users can create their initial owner membership"
on public.couple_members for insert
to authenticated
with check (
  public.can_create_initial_owner_membership(auth.uid(), couple_id, user_id, role, status)
);

create policy "Couple members can read memberships"
on public.couple_members for select
to authenticated
using (public.is_active_couple_member(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create policy "Couple owners can update memberships"
on public.couple_members for update
to authenticated
using (public.is_platform_admin(auth.uid()) or public.is_couple_owner(auth.uid(), couple_id))
with check (public.is_platform_admin(auth.uid()) or public.is_couple_owner(auth.uid(), couple_id));

create policy "Couple managers can create wedding sites"
on public.wedding_sites for insert
to authenticated
with check (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));

create policy "Couple members can read own wedding sites"
on public.wedding_sites for select
to authenticated
using (
  public.is_active_couple_member(auth.uid(), couple_id)
  or public.is_platform_admin(auth.uid())
  or status = 'published'
);

create policy "Guests can read published wedding sites"
on public.wedding_sites for select
to anon
using (status = 'published');

create policy "Couple managers can update wedding sites"
on public.wedding_sites for update
to authenticated
using (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()))
with check (public.can_manage_couple(auth.uid(), couple_id) or public.is_platform_admin(auth.uid()));
