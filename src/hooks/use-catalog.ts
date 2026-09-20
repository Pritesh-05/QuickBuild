import { useQuery } from "@tanstack/react-query";
import { CATALOG as STATIC_CATALOG } from "@/data/catalog";
import { getCatalog } from "@/lib/functions/catalog.functions";

/**
 * Returns the parts catalog. Renders instantly with the built-in static
 * data (via initialData, so there's no loading state to handle anywhere
 * this is used), then silently swaps in the database-backed catalog once
 * it resolves — which is a no-op if Supabase isn't configured, since the
 * server falls back to the same static data in that case.
 */
export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    initialData: STATIC_CATALOG,
    staleTime: 30_000,
  });
}
