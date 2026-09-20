import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CategoryId, Part } from "@/data/types";
import { loadCatalog } from "./catalog-loader";

/** The full parts catalog, grouped by category. DB-backed when Supabase is
 * configured and seeded; falls back to the built-in static catalog otherwise. */
export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<CategoryId, Part[]>> => loadCatalog(),
);

/** Whether the signed-in user is an admin (can manage the parts catalog). */
export const amIAdmin = createServerFn({ method: "GET" }).handler(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return Boolean(data);
});

const COMMON_KEYS = new Set([
  "id",
  "category",
  "brand",
  "name",
  "price",
  "rating",
  "reviews",
  "performance",
  "popularity",
  "power",
  "highlight",
  "accent",
]);

function splitSpecs(part: Record<string, unknown>) {
  const specs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(part)) {
    if (!COMMON_KEYS.has(key)) specs[key] = value;
  }
  return specs;
}

const partSchema = z
  .object({
    id: z.string().min(1),
    category: z.enum([
      "cpu",
      "gpu",
      "motherboard",
      "ram",
      "storage",
      "psu",
      "case",
      "cooler",
      "monitor",
      "mouse",
      "keyboard",
    ]),
    brand: z.string().min(1),
    name: z.string().min(1),
    price: z.number().nonnegative(),
    rating: z.number().min(0).max(5),
    reviews: z.number().int().nonnegative(),
    performance: z.number().int().min(0).max(100),
    popularity: z.number().int().min(0).max(100),
    power: z.number().int().nonnegative(),
    highlight: z.string(),
    accent: z.string(),
  })
  // Category-specific fields ride along as extra keys and get bucketed
  // into `specs` server-side — the admin form sends the flat Part shape.
  .passthrough();

/** Admin-only: create or update a part (upsert, keyed on id). RLS on the
 * `parts` table enforces the admin check — this errors for non-admins. */
export const adminUpsertPart = createServerFn({ method: "POST" })
  .validator(partSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const {
      id,
      category,
      brand,
      name,
      price,
      rating,
      reviews,
      performance,
      popularity,
      power,
      highlight,
      accent,
    } = data;
    const specs = splitSpecs(data);

    const { error } = await supabase.from("parts").upsert({
      id,
      category,
      brand,
      name,
      price,
      rating,
      reviews,
      performance,
      popularity,
      power,
      highlight,
      accent,
      specs,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
    return { id };
  });

/** Admin-only: delete a part. RLS enforces the admin check. */
export const adminDeletePart = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("parts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
