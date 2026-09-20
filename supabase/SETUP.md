# Setting up login + saved builds (Supabase, free tier)

## 1. Create a Supabase project
1. Go to https://supabase.com → sign up (free) → **New project**.
2. Pick a name, a database password (save it somewhere), and a region close to you.
3. Wait ~2 minutes for it to provision.

## 2. Get your API keys
In the project dashboard: **Settings → API**.
- Copy **Project URL** → this is `SUPABASE_URL` / `VITE_SUPABASE_URL`.
- Copy **anon public** key → this is `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`.

Create a `.env` file in the project root (copy `.env.example`) and paste these in.
`.env` is already git-ignored — never commit real keys.

## 3. Create the database tables
In the dashboard: **SQL Editor → New query**, run these three files from
`supabase/`, in order:
1. `schema.sql` — the `builds` table (saved builds), with Row Level
   Security so each user can only ever read/write their own builds.
2. `schema-parts-admin.sql` — the `parts` table (the product catalog) and
   an `admins` table that controls who can edit it. Anyone can read the
   catalog; only admins can add/edit/delete parts.
3. `seed-parts.sql` — populates `parts` with the ~70 built-in components,
   so the catalog isn't empty on first run. Safe to re-run.

## 4. Turn on email/password auth
**Authentication → Providers → Email** is enabled by default. Optional:
turn off "Confirm email" while testing locally so signup logs you straight in
(Authentication → Providers → Email → toggle "Confirm email").

## 5. Turn on Google login
1. **Authentication → Providers → Google** → toggle it on.
2. You'll need a Google OAuth client:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create an **OAuth client ID** → Application type: **Web application**.
   - Authorized redirect URI: use the callback URL Supabase shows you on the
     Google provider page (looks like
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
   - Copy the generated **Client ID** and **Client Secret** into Supabase's
     Google provider settings and save.
3. In your app, once deployed, add your production URL under
   **Authentication → URL Configuration → Redirect URLs** (e.g.
   `https://yourapp.com/auth/callback`), and keep
   `http://localhost:3000/auth/callback` there too for local dev. Also add
   `http://localhost:3000/auth/reset` (and its production equivalent) —
   that's where "forgot password" email links land.

## 6. Install and run
```sh
npm install     # pulls in @supabase/supabase-js and @supabase/ssr
npm run dev
```

Then go to `/login` — sign up with email/password or continue with Google.
Once signed in, you can save/load builds from the Builder page's
**Save build** button and the **Account** page.

## 7. Make yourself an admin (optional)
Admins can add, edit, and delete catalog parts from `/admin`. After signing
up once in the app, run this in the SQL editor with your own email:
```sql
insert into public.admins (email) values ('you@example.com');
```
Then visit `/account` — you'll see a "Manage parts catalog" link.

## How it fits together
- `src/lib/supabase/server.ts` — server-only client, reads/writes the auth
  session via HTTP cookies (used in server functions and SSR).
- `src/lib/supabase/client.ts` — browser client, used only on the login page
  for interactive sign in/up/OAuth.
- `src/lib/functions/auth.functions.ts` — `fetchUser` (used in
  `__root.tsx`'s `beforeLoad` so every route knows who's logged in) and
  `signOutFn`.
- `src/lib/functions/builds.functions.ts` — `saveBuild`, `listBuilds`,
  `getBuild`, `deleteBuild` — all scoped to the signed-in user via Postgres
  RLS, not just application code, so even a bug can't leak one user's
  builds to another.
- `src/lib/functions/catalog-loader.ts` — reads the parts catalog from
  Postgres, falling back to the built-in static catalog (`src/data/`) if
  Supabase isn't configured or the `parts` table is empty. Used both by the
  client-facing `getCatalog` and internally to resolve saved builds.
- `src/lib/functions/catalog.functions.ts` — `getCatalog` (public),
  `amIAdmin`, `adminUpsertPart`, `adminDeletePart` (RLS-enforced admin-only).
- `src/hooks/use-catalog.ts` — the client hook every page reads the catalog
  through; renders instantly with static data, silently swaps in DB data
  once fetched.
- `supabase/schema.sql` — the `builds` table + RLS policies.
- `supabase/schema-parts-admin.sql` — the `parts` + `admins` tables, the
  `is_admin()` function, and RLS policies.
- `supabase/seed-parts.sql` — the initial catalog data.
