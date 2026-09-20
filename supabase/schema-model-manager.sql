-- QuickBuild: admin-manageable 3D model overrides
-- Run this once in the Supabase SQL editor, after schema-parts-admin.sql.
--
-- Covers the four *shared* model files (monitor/keyboard/mouse/mascot),
-- not per-catalog-part models — those render as hand-built procedural
-- geometry (see src/components/three/models.tsx) and aren't swappable
-- from here. This lets an admin replace the .glb file for one of these
-- four, and tune its scale/rotation, from the admin UI instead of editing
-- code and reading console logs.

-- Public bucket: reads happen from every builder's browser (the 3D scene
-- loads these directly), so serving them via the public URL — no RLS
-- consulted on GET — is correct and matches how /public/models/*.glb
-- already works today.
insert into storage.buckets (id, name, public)
values ('model-assets', 'model-assets', true)
on conflict (id) do nothing;

create policy "Admins can upload model assets"
  on storage.objects for insert
  with check (bucket_id = 'model-assets' and public.is_admin());

create policy "Admins can replace model assets"
  on storage.objects for update
  using (bucket_id = 'model-assets' and public.is_admin())
  with check (bucket_id = 'model-assets' and public.is_admin());

create policy "Admins can delete model assets"
  on storage.objects for delete
  using (bucket_id = 'model-assets' and public.is_admin());

-- One row per shared model. A row existing (or a null model_url) means
-- "use the app's built-in default" for whichever fields aren't set — the
-- app fills in the rest from its own hardcoded defaults, so this table
-- only needs to hold what an admin has actually changed. In practice the
-- app always upserts every column together, so this stays simple.
create table if not exists public.model_overrides (
  name text primary key check (name in ('monitor', 'keyboard', 'mouse', 'mascot')),
  model_url text,
  scale_x numeric not null default 1,
  scale_y numeric not null default 1,
  scale_z numeric not null default 1,
  rotation_x numeric not null default 0,
  rotation_y numeric not null default 0,
  rotation_z numeric not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists model_overrides_set_updated_at on public.model_overrides;
create trigger model_overrides_set_updated_at
  before update on public.model_overrides
  for each row execute function public.set_updated_at();

alter table public.model_overrides enable row level security;

create policy "Anyone can read model overrides"
  on public.model_overrides for select
  using (true);

create policy "Admins can set model overrides"
  on public.model_overrides for insert
  with check (public.is_admin());

create policy "Admins can update model overrides"
  on public.model_overrides for update
  using (public.is_admin())
  with check (public.is_admin());