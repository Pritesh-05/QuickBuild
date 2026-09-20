import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const exchangeCode = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().optional() }))
  .handler(async ({ data }) => {
    if (!data.code) return { ok: false };
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);
    return { ok: !error };
  });

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? search["code"] : undefined,
  }),
  beforeLoad: async ({ search }) => {
    await exchangeCode({ data: { code: search.code } });
    throw redirect({ to: "/account" });
  },
});
