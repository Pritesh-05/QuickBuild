-- QuickBuild: allow monitor/mouse/keyboard in the parts catalog
-- Run this once in the Supabase SQL editor if you already ran
-- schema-parts-admin.sql before these categories existed. Safe to skip
-- (and safe to re-run) on a fresh install — schema-parts-admin.sql
-- already includes the wider constraint from the start.

alter table public.parts drop constraint if exists parts_category_check;

alter table public.parts add constraint parts_category_check check (
  category in ('cpu','gpu','motherboard','ram','storage','psu','case','cooler','monitor','mouse','keyboard')
);
