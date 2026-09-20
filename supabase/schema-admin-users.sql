-- QuickBuild: admin user management
-- Run this once in the Supabase SQL editor, after schema.sql and
-- schema-parts-admin.sql.
--
-- `auth.users` isn't queryable from the app (no service role key is
-- configured — see src/lib/supabase/server.ts), so the admin Users page
-- reads from a `public.profiles` table that mirrors it instead, kept in
-- sync by a trigger on signup. Listing and role changes go through
-- SECURITY DEFINER functions the same way public.is_admin() already does,
-- so the privilege check lives in one place (the function body) rather
-- than being re-implemented in RLS policies per table.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Keeps profiles in sync with auth.users going forward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill for accounts created before this migration. Works only
-- when run from the SQL editor (executes as the postgres role, which can
-- read auth.users); the app itself never gets that access.
insert into public.profiles (id, email, display_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Every user, with their admin flag and how many builds they've saved.
-- Admin-gated inside the function body (raises for non-admins) rather than
-- via RLS, matching public.is_admin()'s existing pattern.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  is_admin boolean,
  build_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
    select
      p.id,
      p.email,
      p.display_name,
      p.created_at,
      exists (select 1 from public.admins a where a.email = p.email) as is_admin,
      (select count(*) from public.builds b where b.user_id = p.id) as build_count
    from public.profiles p
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- Promote/demote by email. Admins can't demote themselves, so there's
-- always at least one admin left standing.
create or replace function public.admin_set_admin(target_email text, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if not make_admin and target_email = (auth.jwt() ->> 'email') then
    raise exception 'cannot remove your own admin access';
  end if;

  if make_admin then
    insert into public.admins (email) values (target_email) on conflict do nothing;
  else
    delete from public.admins where email = target_email;
  end if;
end;
$$;

grant execute on function public.admin_set_admin(text, boolean) to authenticated;