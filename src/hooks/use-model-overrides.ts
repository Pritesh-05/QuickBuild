import { useQuery } from "@tanstack/react-query";
import { MODEL_OVERRIDE_DEFAULTS, type ModelKey, type ModelOverride } from "@/data/model-defaults";
import { getModelOverrides } from "@/lib/functions/model-manager.functions";

/**
 * Scale/rotation/file for the four shared 3D models (monitor, keyboard,
 * mouse, review mascot). Renders instantly with the built-in hand-tuned
 * defaults (via initialData, so there's no loading state to handle
 * anywhere this is used — same pattern as useCatalog), then silently
 * swaps in any admin-saved override once it resolves.
 */
export function useModelOverrides() {
  return useQuery({
    queryKey: ["model-overrides"],
    queryFn: () => getModelOverrides(),
    initialData: MODEL_OVERRIDE_DEFAULTS,
    staleTime: 30_000,
  });
}

export function useModelOverride(key: ModelKey): ModelOverride {
  const { data } = useModelOverrides();
  return data[key];
}