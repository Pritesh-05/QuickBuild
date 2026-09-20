# QuickBuild

A PC configurator with live compatibility checking, side-by-side spec comparison, and an interactive 3D build preview.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Pritesh-05/QuickBuild)

**Live app:** [_add your Vercel URL here once deployed_](https://quick-build-neon.vercel.app)

## Features

- **Guided builder** — assemble a full PC part by part with real-time socket, memory, clearance, and wattage compatibility checks
- **Interactive 3D preview** — see your build assembled in 3D, with drag-and-drop part installation
- **Free View** — walk around a fully rendered 3D room with your build on the desk
- **Compare** — put parts side by side on the specs that matter
- **Accounts** — sign in to save builds and pick up where you left off, on any device
- **Shareable builds** — send a build to anyone with a link, with a one-click "continue editing" handoff
- **Admin console** (`/admin`) — a separate console (not the consumer site) for managing the parts catalog, user accounts, and the shared 3D models (monitor/keyboard/mouse/review mascot), including live scale/rotation tuning and file uploads

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing, server functions) on [Nitro](https://nitro.build)
- TypeScript, Tailwind CSS, shadcn/ui
- [React Three Fiber](https://r3f.docs.pmnd.rs/) / drei for the 3D scenes
- [Supabase](https://supabase.com) — Postgres, Auth, Storage
- [TanStack Query](https://tanstack.com/query) for data fetching/caching

## Local development

Requires Node.js 20+.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
```

Copy `.env.example` to `.env` and fill in your Supabase project's URL and anon key (both a plain and a `VITE_`-prefixed copy are needed — see the comments in `.env.example` for why):

```sh
cp .env.example .env
```

Then start the dev server:

```sh
npm run dev
```

The app runs with built-in static catalog data even without Supabase configured — you only need the database set up for accounts, saved builds, and the admin console.

## Database setup

Run these once in your Supabase project's SQL editor, **in this order**:

1. `supabase/schema.sql` — base tables, `is_admin()`, shared trigger helpers
2. `supabase/schema-parts-admin.sql` — parts catalog table + admin-only write access
3. `supabase/seed-parts.sql` — seeds the built-in parts catalog
4. `supabase/seed-peripherals.sql` — seeds monitor/keyboard/mouse parts
5. `supabase/schema-shared-builds.sql` — public shareable build links
6. `supabase/schema-admin-users.sql` — user listing + role management for the admin console
7. `supabase/schema-admin-delete-user.sql` — full account deletion for admins
8. `supabase/schema-model-manager.sql` — storage bucket + table for the admin 3D-model manager

All of these are safe to re-run (they upsert / use `if not exists`). Skip `supabase/schema-add-peripherals.sql` — it's a patch only needed if `schema-parts-admin.sql` was run before peripheral categories existed; a fresh install doesn't need it.

After running the migrations, make yourself an admin — sign up in the app once, then in the SQL editor:

```sql
insert into public.admins (email) values ('you@example.com');
```

## Deploying

This project deploys to [Vercel](https://vercel.com) with zero build configuration — the Nitro Vite plugin is already registered in `vite.config.ts`, so Vercel auto-detects the framework. Import the repo at [vercel.com/new](https://vercel.com/new), set the four environment variables listed above (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), and deploy.

After your first deploy, add your production URL to **Authentication → URL Configuration → Site URL / Redirect URLs** in your Supabase project settings, so password-reset and OAuth links point to the right place.
