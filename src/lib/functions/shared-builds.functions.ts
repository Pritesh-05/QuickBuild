import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { BuildState, CategoryId } from "@/data/types";
import { EMPTY_BUILD } from "@/lib/compatibility";
import { loadCatalog } from "./catalog-loader";

type PartIdMap = Partial<Record<CategoryId, string>>;

export interface SharedBuild {
  id: string;
  name: string;
  createdAt: string;
  build: BuildState;
}

const createSharedBuildSchema = z.object({
  name: z.string().min(1).max(80),
  build: z.record(z.string(), z.string().nullable()),
});

/** Creates a public, read-only snapshot of a build that anyone with the
 * link can view. Deliberately doesn't require sign-in, mirroring the fact
 * that a build itself can be assembled without an account. */
export const createSharedBuild = createServerFn({ method: "POST" })
  .validator(createSharedBuildSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    if (!isSupabaseConfigured()) {
      throw new Error("Sharing isn't configured on this deployment.");
    }
    const supabase = getSupabaseServerClient();
    const { data: saved, error } = await supabase
      .from("shared_builds")
      .insert({ name: data.name, parts: data.build })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: saved.id as string };
  });

/** Fetches a publicly shared build snapshot by id. Returns null (never
 * throws) for a missing or invalid id, so callers can 404 cleanly. */
export const getSharedBuild = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<SharedBuild | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("shared_builds")
      .select("id, name, parts, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const catalog = await loadCatalog();
    const ids = data.parts as PartIdMap;
    const build: BuildState = { ...EMPTY_BUILD };
    (Object.keys(catalog) as CategoryId[]).forEach((category) => {
      const partId = ids[category];
      if (!partId) return;
      const found = catalog[category].find((p) => p.id === partId);
      if (found) build[category] = found as never;
    });

    return {
      id: data.id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
      build,
    };
  });
