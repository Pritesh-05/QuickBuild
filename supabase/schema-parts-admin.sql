-- QuickBuild: database-backed parts catalog + admin access
-- Run this once in the Supabase SQL editor, after schema.sql.

-- ── Catalog ──────────────────────────────────────────────────────────────
-- Common fields are real columns; everything category-specific (socket,
-- cores, wattage, form factor, etc.) lives in `specs` as JSONB, since each
-- of the 8 categories has a different shape. The app merges specs back onto
-- the part object when reading, and splits them back out when writing.
create table if not exists public.parts (
  id text primary key,
  category text not null check (
    category in ('cpu','gpu','motherboard','ram','storage','psu','case','cooler','monitor','mouse','keyboard')
  ),
  brand text not null,
  name text not null,
  price numeric not null default 0,
  rating numeric not null default 0,
  reviews integer not null default 0,
  performance integer not null default 0,
  popularity integer not null default 0,
  power integer not null default 0,
  highlight text not null default '',
  accent text not null default '#2f6fe8',
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parts_category_idx on public.parts (category);

drop trigger if exists parts_set_updated_at on public.parts;
create trigger parts_set_updated_at
  before update on public.parts
  for each row execute function public.set_updated_at();

-- ── Admin access ─────────────────────────────────────────────────────────
-- Just a table of admin emails. Locked down with RLS and no policies, so it
-- is only ever readable through the is_admin() function below (which runs
-- with the privileges of its owner, bypassing that lockdown) — never
-- directly queryable by anon/authenticated clients.
create table if not exists public.admins (
  email text primary key
);

alter table public.admins enable row level security;
-- Intentionally no policies: nobody can SELECT/INSERT/UPDATE/DELETE this
-- table via the anon/authenticated API roles. Manage it from the SQL editor.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ── Row Level Security on parts ─────────────────────────────────────────
alter table public.parts enable row level security;

create policy "Anyone can read the catalog"
  on public.parts for select
  using (true);

create policy "Admins can add parts"
  on public.parts for insert
  with check (public.is_admin());

create policy "Admins can edit parts"
  on public.parts for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete parts"
  on public.parts for delete
  using (public.is_admin());

-- ── Make yourself an admin ───────────────────────────────────────────────
-- After signing up in the app once, run this with your own email:
--
--   insert into public.admins (email) values ('you@example.com');
