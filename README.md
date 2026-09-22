# QuickBuild — PC Part Picker & 3D Builder

Pick PC components, check compatibility instantly, compare hardware specs side by side, and assemble your build in an interactive 3D configurator — with live compatibility checks, PDF export, and real marketplace buy links.

**🔗 Live demo:** [https://quick-build-neon.vercel.app](https://quick-build-neon.vercel.app)

---

## Features

- **3D build console** — drag and drop parts onto an interactive 3D chassis, with live socket, memory, clearance and wattage compatibility checks
- **Compare** — line up CPUs, GPUs, motherboards, memory, storage, coolers, monitors, mice and keyboards side by side, with best-value highlighting per spec row
- **Prebuilds** — load curated starting builds and tweak from there
- **Build review & share** — a scored build report with strengths/suggestions, a shareable public link, and a PDF export
- **Where to Buy** — for every part currently in your build, live search links to Amazon.in, Flipkart, Reliance Digital and Croma
- **Pricing in ₹ (INR)** — catalog prices and the PDF export both use Indian Rupees; the PDF shows a realistic street-price *range* per part rather than one exact figure
- **Admin console** — manage the parts catalog and 3D model overrides from a signed-in admin account (optional, requires Supabase)

## Tech stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (React, SSR)
- TypeScript
- [Three.js](https://threejs.org) / [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) for the 3D viewer
- Tailwind CSS + [Radix UI](https://www.radix-ui.com/) primitives
- [Supabase](https://supabase.com) (Postgres + Auth) — optional; the app runs on static catalog data without it
- [jsPDF](https://github.com/parallax/jsPDF) for the build PDF export

## Getting started

You'll need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don't have it.

```sh
git clone <this-repository-url>
cd "3D PartPicker"
npm install
npm run dev
```

Open the printed local URL. The app works out of the box with the built-in static parts catalog — Supabase is optional (see below).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

## Environment variables

Copy `.env.example` to `.env` and fill in your own Supabase project's values if you want auth, saved/shared builds, or the admin console:

| Variable | Used by |
| --- | --- |
| `SUPABASE_URL` | Server-side Supabase client |
| `SUPABASE_ANON_KEY` | Server-side Supabase client |
| `VITE_SUPABASE_URL` | Client-side Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Client-side Supabase client |

Without these set, the app falls back to the static, built-in catalog automatically — nothing breaks, you just won't have login, saved builds, or the admin panel.

## Database setup (optional, for Supabase)

SQL files live in `supabase/`, run in order in your Supabase project's SQL editor:

1. `schema.sql`, `schema-admin-users.sql`, `schema-parts-admin.sql`, `schema-add-peripherals.sql`, `schema-shared-builds.sql`, `schema-model-manager.sql`, `schema-admin-delete-user.sql` — table/RLS setup
2. `seed-parts.sql`, `seed-peripherals.sql` — seeds the catalog with the built-in parts (prices already in ₹). Safe to re-run; upserts by id.

**Upgrading an existing database that still has old $-scale prices?** Run `migrate-prices-to-inr.sql` once — it updates every built-in part to its correct ₹ value without touching any parts you've added yourself through the admin panel. Safe to run more than once.

See `supabase/SETUP.md` for the full walkthrough.

## Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, **Add New → Project** and import the repo.
3. If you're using Supabase, add the four environment variables above under **Project Settings → Environment Variables** (a local `.env` file is not read by Vercel).
4. Deploy. Every push to your production branch redeploys automatically from then on — no manual restart needed.
5. If the site doesn't reflect a change after deploying, hard-refresh (Ctrl/Cmd+Shift+R) to bypass a cached bundle.

## Project structure

```
src/
  components/   UI, 3D viewer, build console pieces
  data/         static parts catalog, category metadata, types
  hooks/        useBuild, useCatalog, etc.
  lib/          compatibility engine, PDF export, formatting, Supabase clients
  pages/        route-level page components
  routes/       TanStack Router file-based routes (thin wrappers around pages/)
supabase/       schema + seed SQL, setup guide
```
