-- QuickBuild: seed the parts catalog with monitor/mouse/keyboard parts.
-- Run this once after schema-add-peripherals.sql (or schema-parts-admin.sql
-- on a fresh install), in the Supabase SQL editor.
-- Safe to re-run: it upserts by id rather than erroring on conflict.

insert into public.parts
  (id, category, brand, name, price, rating, reviews, performance, popularity, power, highlight, accent, specs)
values
  ('mon-27-1440-165', 'monitor', 'LG', 'UltraGear 27GR75Q', 249.99, 4.6, 4210, 62, 88, 35, '27" QHD · 165Hz IPS', '#2f6fe8', '{"size":27,"resolution":"2560x1440","refreshRate":165,"panelType":"IPS","responseTime":1}'::jsonb),
  ('mon-24-1080-144', 'monitor', 'ASUS', 'TUF Gaming VG249Q3A', 149.99, 4.5, 3120, 42, 70, 28, '24" FHD · 180Hz IPS', '#2f6fe8', '{"size":23.8,"resolution":"1920x1080","refreshRate":180,"panelType":"IPS","responseTime":1}'::jsonb),
  ('mon-32-4k-144', 'monitor', 'Samsung', 'Odyssey G7 32"', 549.99, 4.7, 2870, 88, 64, 48, '32" 4K · 144Hz VA · Curved', '#2f6fe8', '{"size":32,"resolution":"3840x2160","refreshRate":144,"panelType":"VA","responseTime":1}'::jsonb),
  ('mon-34-uw-165', 'monitor', 'Dell', 'Alienware AW3423DWF', 799.99, 4.8, 1560, 92, 55, 90, '34" Ultrawide QD-OLED · 165Hz', '#2f6fe8', '{"size":34,"resolution":"3440x1440","refreshRate":165,"panelType":"QD-OLED","responseTime":0.1}'::jsonb),

  ('mouse-g203', 'mouse', 'Logitech', 'G203 Lightsync', 24.99, 4.5, 15200, 32, 92, 1, 'Wired · 8000 DPI', '#4a9e2f', '{"connection":"Wired","sensor":"Optical","dpi":8000,"buttons":6,"weight":85}'::jsonb),
  ('mouse-deathadder-v3', 'mouse', 'Razer', 'DeathAdder V3', 69.99, 4.7, 8340, 58, 80, 1, 'Wired · 30000 DPI · Ergonomic', '#4a9e2f', '{"connection":"Wired","sensor":"Focus Pro 30K","dpi":30000,"buttons":5,"weight":59}'::jsonb),
  ('mouse-superlight-2', 'mouse', 'Logitech', 'G Pro X Superlight 2', 159.99, 4.8, 5210, 78, 68, 1, 'Wireless · 32000 DPI · 60g', '#4a9e2f', '{"connection":"Wireless","sensor":"HERO 2","dpi":32000,"buttons":5,"weight":60}'::jsonb),

  ('kb-k120', 'keyboard', 'Logitech', 'K120', 14.99, 4.3, 22100, 18, 60, 1, 'Wired · Membrane · Full size', '#c9a227', '{"connection":"Wired","switchType":"Membrane","layout":"Full size","hotswap":false}'::jsonb),
  ('kb-apex-pro', 'keyboard', 'SteelSeries', 'Apex Pro TKL', 189.99, 4.7, 4310, 72, 74, 2, 'Wired · Adjustable mechanical · TKL', '#c9a227', '{"connection":"Wired","switchType":"OmniPoint (adjustable)","layout":"Tenkeyless","hotswap":false}'::jsonb),
  ('kb-keychron-k8-pro', 'keyboard', 'Keychron', 'K8 Pro', 109.99, 4.6, 6120, 60, 66, 2, 'Wireless · Hot-swap mechanical · TKL', '#c9a227', '{"connection":"Wireless","switchType":"Gateron Hot-swap","layout":"Tenkeyless","hotswap":true}'::jsonb)
on conflict (id) do update set
  category = excluded.category,
  brand = excluded.brand,
  name = excluded.name,
  price = excluded.price,
  rating = excluded.rating,
  reviews = excluded.reviews,
  performance = excluded.performance,
  popularity = excluded.popularity,
  power = excluded.power,
  highlight = excluded.highlight,
  accent = excluded.accent,
  specs = excluded.specs;
