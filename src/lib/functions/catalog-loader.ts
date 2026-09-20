import { CATALOG as STATIC_CATALOG } from "@/data/catalog";
import type { CategoryId, Part } from "@/data/types";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

interface PartRow {
  id: string;
  category: CategoryId;
  brand: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  performance: number;
  popularity: number;
  power: number;
  highlight: string;
  accent: string;
  specs: Record<string, unknown>;
}

function rowToPart(row: PartRow): Part {
  return {
    id: row.id,
    category: row.category,
    brand: row.brand,
    name: row.name,
    price: row.price,
    rating: row.rating,
    reviews: row.reviews,
    performance: row.performance,
    popularity: row.popularity,
    power: row.power,
    highlight: row.highlight,
    accent: row.accent,
    ...row.specs,
    // The spread above can't be trusted to have narrowed `category`-specific
    // fields, but every row was written by our own admin form against this
    // exact shape — safe to assert here.
  } as Part;
}

function groupByCategory(parts: Part[]): Record<CategoryId, Part[]> {
  const grouped: Record<CategoryId, Part[]> = {
    cpu: [],
    gpu: [],
    motherboard: [],
    ram: [],
    storage: [],
    psu: [],
    case: [],
    cooler: [],
    monitor: [],
    mouse: [],
    keyboard: [],
  };
  parts.forEach((part) => {
    (grouped[part.category] as Part[]).push(part);
  });
  return grouped;
}

/**
 * The parts catalog, server-side. Reads from Postgres when Supabase is
 * configured and the table has rows; otherwise falls back to the built-in
 * static catalog, so the app works fully standalone without a database.
 * Used both by the client-facing getCatalog server fn and internally by
 * builds.functions.ts to resolve saved builds' part IDs.
 */
export async function loadCatalog(): Promise<Record<CategoryId, Part[]>> {
  if (!isSupabaseConfigured()) return STATIC_CATALOG;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("parts").select("*");
    if (error) throw error;
    if (!data || data.length === 0) return STATIC_CATALOG;

    return groupByCategory((data as PartRow[]).map(rowToPart));
  } catch {
    // Table not migrated yet, network hiccup, etc. — never let the whole
    // catalog fail to load over this.
    return STATIC_CATALOG;
  }
}

/** Flat list variant of loadCatalog(), for lookups by id. */
export async function loadAllParts(): Promise<Part[]> {
  const catalog = await loadCatalog();
  return Object.values(catalog).flat();
}
