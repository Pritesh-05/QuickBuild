-- QuickBuild: publicly shareable build snapshots
-- Run this once in the Supabase SQL editor (or via `supabase db push`),
-- in addition to schema.sql.
--
-- Unlike `builds`, these rows are NOT tied to a signed-in user. Anyone can
-- create one (by sharing a build) and anyone with the id can view it —
-- that's the point of a share link. Don't store anything sensitive here;
-- it only ever holds a build name and a map of category -> part id.

create extension if not exists "pgcrypto";

create table if not exists public.shared_builds (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Build',
  -- Map of category id -> part id, e.g. {"cpu": "cpu-ryzen-7-9800x3d", ...}
  parts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shared_builds enable row level security;

-- Anyone can create a share link (no auth required — sharing a build
-- doesn't require an account any more than building one does).
create policy "Anyone can create a shared build"
  on public.shared_builds for insert
  with check (true);

-- Anyone with the id can view it — that's what makes it a share link.
create policy "Anyone can view a shared build"
  on public.shared_builds for select
  using (true);

-- No update/delete policies are defined on purpose: once created, a
-- shared snapshot is immutable and can only be removed via the Supabase
-- dashboard or service-role access.
