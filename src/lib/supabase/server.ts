import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

/** True when SUPABASE_URL/SUPABASE_ANON_KEY are set. Lets callers skip
 * Supabase-dependent work gracefully instead of crashing the whole app. */
export function isSupabaseConfigured() {
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_ANON_KEY"]);
}

/**
 * Server-only Supabase client. Reads/writes the auth session via HTTP
 * cookies so SSR routes and server functions can see the logged-in user.
 * Never import this from client code — it relies on server-only cookie APIs.
 * Throws if env vars aren't set — check isSupabaseConfigured() first if the
 * caller should degrade gracefully instead (e.g. anonymous browsing).
 */
export function getSupabaseServerClient() {
  const url = process.env["SUPABASE_URL"];
  const anonKey = process.env["SUPABASE_ANON_KEY"];

  if (!url || !anonKey) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables. See supabase/SETUP.md.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
        cookies.forEach((cookie) => {
          // @supabase/ssr's CookieOptions and h3's CookieSerializeOptions are
          // structurally near-identical but declared independently, so they
          // don't unify under this project's strict TS settings — safe to
          // bridge them directly here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCookie(cookie.name, cookie.value, cookie.options as any);
        });
      },
    },
  });
}
