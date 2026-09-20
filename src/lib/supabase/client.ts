import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client. Used for interactive auth flows
 * (sign in / sign up / OAuth / sign out) — it manages the session cookie
 * directly in the browser and keeps SSR cookies in sync.
 */
export function getSupabaseBrowserClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];

  if (!url || !anonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables. See supabase/SETUP.md.",
    );
  }

  return createBrowserClient(url, anonKey);
}
