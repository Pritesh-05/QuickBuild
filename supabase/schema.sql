-- QuickBuild: saved builds table
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Auth/users are handled entirely by Supabase's built-in `auth.users` table —
-- you don't need to create your own users table.

create extension if not exists "pgcrypto";

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Build',
  -- Map of category id -> part id, e.g. {"cpu": "cpu-ryzen-7-9800x3d", ...}
  parts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builds_user_id_idx on public.builds (user_id);

-- Row Level Security: a user can only ever see/edit/delete their own builds.
alter table public.builds enable row level security;

create policy "Users can view their own builds"
  on public.builds for select
  using (auth.uid() = user_id);

create policy "Users can insert their own builds"
  on public.builds for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own builds"
  on public.builds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own builds"
  on public.builds for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every change.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists builds_set_updated_at on public.builds;
create trigger builds_set_updated_at
  before update on public.builds
  for each row execute function public.set_updated_at();
