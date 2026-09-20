import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
}

/** Reads the logged-in user (if any) from the session cookie. Used in
 * __root.tsx's beforeLoad so every route can access `context.user`.
 * Returns null (treated as "logged out") if Supabase isn't configured yet,
 * so the rest of the app still works without a database set up. */
export const fetchUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      displayName:
        (data.user.user_metadata?.["full_name"] as string | undefined) ??
        data.user.email.split("@")[0] ??
        "there",
    };
  },
);

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  return { success: true };
});
