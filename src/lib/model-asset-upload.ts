import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ModelKey } from "@/data/model-defaults";

const BUCKET = "model-assets";
const MAX_BYTES = 20 * 1024 * 1024; // 20MB — generous for a single glTF/GLB, cheap to enforce client-side before ever hitting the network

export class ModelUploadError extends Error {}

/** Uploads a replacement .glb/.gltf for one of the four shared models
 * (monitor/keyboard/mouse/mascot) straight to Supabase Storage from the
 * browser — admin-gated by the storage.objects RLS policies in
 * schema-model-manager.sql, not by anything in this function. Returns the
 * new file's public URL, to be saved via adminSaveModelOverride. */
export async function uploadModelFile(key: ModelKey, file: File): Promise<string> {
  if (!/\.(glb|gltf)$/i.test(file.name)) {
    throw new ModelUploadError("Only .glb or .gltf files are supported.");
  }
  if (file.size > MAX_BYTES) {
    throw new ModelUploadError(
      `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — please keep it under 20MB.`,
    );
  }

  const supabase = getSupabaseBrowserClient();
  const path = `${key}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "model/gltf-binary",
    upsert: false,
  });
  if (error) throw new ModelUploadError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort cleanup of a previously-uploaded file when it's replaced or
 * removed. Only ever called on URLs that came from this same bucket
 * (checked by the caller) — silently no-ops on failure since a stray
 * orphaned file in storage is a minor cost, not worth surfacing an error
 * for during what the admin experiences as a successful save. */
export async function deleteModelFile(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);
  if (!path) return;

  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Best-effort — see comment above.
  }
}