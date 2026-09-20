import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BuildState, CategoryId, Part } from "@/data/types";
import { EMPTY_BUILD } from "@/lib/compatibility";
import { loadCatalog } from "./catalog-loader";

type PartIdMap = Partial<Record<CategoryId, string>>;

function toPartIdMap(build: BuildState): PartIdMap {
  const ids: PartIdMap = {};
  (Object.keys(build) as CategoryId[]).forEach((category) => {
    const part = build[category];
    if (part) ids[category] = part.id;
  });
  return ids;
}

function fromPartIdMap(ids: PartIdMap, catalog: Record<CategoryId, Part[]>): BuildState {
  const next: BuildState = { ...EMPTY_BUILD };
  (Object.keys(catalog) as CategoryId[]).forEach((category) => {
    const id = ids[category];
    if (!id) return;
    const found = catalog[category].find((p) => p.id === id);
    if (found) next[category] = found as never;
  });
  return next;
}

async function requireUserId() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return { supabase, userId: data.user.id };
}

export interface SavedBuildSummary {
  id: string;
  name: string;
  updatedAt: string;
  partCount: number;
  estimatedPrice: number;
}

export interface SavedBuild extends SavedBuildSummary {
  build: BuildState;
}

/** List the signed-in user's saved builds (summary only, no full part data). */
export const listBuilds = createServerFn({ method: "GET" }).handler(
  async (): Promise<SavedBuildSummary[]> => {
    const { supabase, userId } = await requireUserId();
    const { data, error } = await supabase
      .from("builds")
      .select("id, name, parts, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const catalog = await loadCatalog();
    return (data ?? []).map((row) => {
      const build = fromPartIdMap(row.parts as PartIdMap, catalog);
      const parts = Object.values(build).filter(Boolean) as { price: number }[];
      return {
        id: row.id as string,
        name: row.name as string,
        updatedAt: row.updated_at as string,
        partCount: parts.length,
        estimatedPrice: parts.reduce((sum, p) => sum + p.price, 0),
      };
    });
  },
);

/** Fetch one saved build (full part data) for the signed-in user. */
export const getBuild = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<SavedBuild | null> => {
    const { supabase, userId } = await requireUserId();
    const { data, error } = await supabase
      .from("builds")
      .select("id, name, parts, updated_at")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const catalog = await loadCatalog();
    const build = fromPartIdMap(data.parts as PartIdMap, catalog);
    const parts = Object.values(build).filter(Boolean) as { price: number }[];
    return {
      id: data.id as string,
      name: data.name as string,
      updatedAt: data.updated_at as string,
      partCount: parts.length,
      estimatedPrice: parts.reduce((sum, p) => sum + p.price, 0),
      build,
    };
  });

const saveBuildSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  build: z.record(z.string(), z.string().nullable()),
});

/** Create or update (upsert, keyed on id) a saved build for the signed-in user. */
export const saveBuild = createServerFn({ method: "POST" })
  .validator(saveBuildSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { supabase, userId } = await requireUserId();

    const row = {
      ...(data.id ? { id: data.id } : {}),
      user_id: userId,
      name: data.name,
      parts: data.build,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await supabase.from("builds").upsert(row).select("id").single();

    if (error) throw new Error(error.message);
    return { id: saved.id as string };
  });

export const deleteBuild = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ success: true }> => {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase.from("builds").delete().eq("id", id).eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export { toPartIdMap };
