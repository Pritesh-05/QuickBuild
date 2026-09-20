import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  MODEL_KEYS,
  MODEL_OVERRIDE_DEFAULTS,
  type ModelKey,
  type ModelOverride,
} from "@/data/model-defaults";

interface ModelOverrideRow {
  name: ModelKey;
  model_url: string | null;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
}

/** Every builder's browser calls this to render the shared models
 * (monitor/keyboard/mouse/mascot) — public, no admin check. Any model an
 * admin hasn't saved an override for falls back to the app's hardcoded
 * default, so this never returns a gap. */
export const getModelOverrides = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<ModelKey, ModelOverride>> => {
    const result = { ...MODEL_OVERRIDE_DEFAULTS };
    if (!isSupabaseConfigured()) return result;

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from("model_overrides").select("*");
      if (error) throw error;

      (data as ModelOverrideRow[] | null)?.forEach((row) => {
        result[row.name] = {
          modelUrl: row.model_url,
          scale: [row.scale_x, row.scale_y, row.scale_z],
          rotation: [row.rotation_x, row.rotation_y, row.rotation_z],
        };
      });
      return result;
    } catch {
      // Table not migrated yet, network hiccup, etc. — fall back to
      // defaults rather than breaking the 3D scene over this.
      return result;
    }
  },
);

const overrideSchema = z.object({
  name: z.enum(["monitor", "keyboard", "mouse", "mascot"]),
  modelUrl: z.string().url().nullable(),
  scale: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
});

/** Admin-only (enforced by RLS on model_overrides, not just this check —
 * see schema-model-manager.sql): save a new file/scale/rotation for one
 * of the four shared models. */
export const adminSaveModelOverride = createServerFn({ method: "POST" })
  .validator(overrideSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("model_overrides").upsert({
      name: data.name,
      model_url: data.modelUrl,
      scale_x: data.scale[0],
      scale_y: data.scale[1],
      scale_z: data.scale[2],
      rotation_x: data.rotation[0],
      rotation_y: data.rotation[1],
      rotation_z: data.rotation[2],
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Admin-only: clear a saved override, reverting that model back to the
 * app's built-in file and hand-tuned defaults. */
export const adminResetModelOverride = createServerFn({ method: "POST" })
  .validator((name: ModelKey) => name)
  .handler(async ({ data: name }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("model_overrides").delete().eq("name", name);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export { MODEL_KEYS };