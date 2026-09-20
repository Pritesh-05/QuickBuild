import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RotateCcw, Sparkle, Upload } from "lucide-react";
import {
  MODEL_DEFAULT_FILES,
  MODEL_KEYS,
  MODEL_LABELS,
  MODEL_OVERRIDE_DEFAULTS,
  type ModelKey,
  type ModelOverride,
} from "@/data/model-defaults";
import { useModelOverrides } from "@/hooks/use-model-overrides";
import {
  adminResetModelOverride,
  adminSaveModelOverride,
} from "@/lib/functions/model-manager.functions";
import { deleteModelFile, ModelUploadError, uploadModelFile } from "@/lib/model-asset-upload";
import { ModelPreviewCanvas } from "@/components/admin/model-preview-canvas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/models")({
  component: AdminModelsPage,
});

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

const AXIS_LABELS = ["X", "Y", "Z"] as const;

function NumberField({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="mono-label text-[10px] text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function AdminModelsPage() {
  const queryClient = useQueryClient();
  const { data: overrides } = useModelOverrides();
  const [selected, setSelected] = useState<ModelKey>("monitor");
  const [draft, setDraft] = useState<ModelOverride>(overrides.monitor);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saved = overrides[selected];
  const isCustomized = saved.modelUrl !== null;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Reset the draft whenever the selected model changes, or when a fresh
  // save comes back from the server (react-query gives us a new object
  // reference on refetch, so this also clears "unsaved changes" state
  // right after a successful save instead of comparing against stale data).
  useEffect(() => {
    setDraft(overrides[selected]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, overrides]);

  function updateScale(axis: 0 | 1 | 2, value: number) {
    setDraft((d) => {
      const scale: [number, number, number] = [...d.scale];
      scale[axis] = value;
      return { ...d, scale };
    });
  }

  function updateRotationDeg(axis: 0 | 1 | 2, valueDeg: number) {
    setDraft((d) => {
      const rotation: [number, number, number] = [...d.rotation];
      rotation[axis] = valueDeg * DEG_TO_RAD;
      return { ...d, rotation };
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadModelFile(selected, file);
      setDraft((d) => ({ ...d, modelUrl: url }));
      toast.success("File uploaded — remember to Save to apply it");
    } catch (err) {
      toast.error(err instanceof ModelUploadError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function resetFileToDefault() {
    setDraft((d) => ({ ...d, modelUrl: null }));
  }

  function resetTransformToDefault() {
    const def = MODEL_OVERRIDE_DEFAULTS[selected];
    setDraft((d) => ({ ...d, scale: def.scale, rotation: def.rotation }));
  }

  async function handleSave() {
    setSaving(true);
    const previousUrl = saved.modelUrl;
    try {
      await adminSaveModelOverride({ data: { name: selected, ...draft } });
      // Best-effort: if we just replaced an uploaded file with a different
      // one (or reverted to the built-in file), the old upload is now
      // orphaned in storage. Only ever clean up URLs that are actually
      // ours — never touch /models/*.glb, the built-in static files.
      if (previousUrl && previousUrl !== draft.modelUrl) {
        void deleteModelFile(previousUrl);
      }
      toast.success(`${MODEL_LABELS[selected]} updated`);
      void queryClient.invalidateQueries({ queryKey: ["model-overrides"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevertAll() {
    if (
      !window.confirm(
        `Revert ${MODEL_LABELS[selected]} to the built-in file and default scale/rotation? This can't be undone.`,
      )
    )
      return;
    try {
      await adminResetModelOverride({ data: selected });
      if (saved.modelUrl) void deleteModelFile(saved.modelUrl);
      toast.success(`${MODEL_LABELS[selected]} reverted to default`);
      void queryClient.invalidateQueries({ queryKey: ["model-overrides"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't revert");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="text-xl font-semibold tracking-[-0.03em]">3D models</h1>
      <p className="mono-label mt-1 text-muted-foreground">
        monitor · keyboard · mouse · review mascot — the shared models every builder sees
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:border-r md:border-border md:pb-0 md:pr-3">
          {MODEL_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "mono-label flex shrink-0 items-center justify-between gap-3 border-l-2 px-2.5 py-1.5 text-left transition-colors",
                selected === key
                  ? "border-brand bg-brand-soft text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <span>{MODEL_LABELS[key]}</span>
              {overrides[key].modelUrl !== null ? (
                <Sparkle className="size-3 text-brand" aria-label="Custom file" />
              ) : null}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="aspect-square overflow-hidden rounded-md border border-border bg-card">
              <ModelPreviewCanvas
                url={draft.modelUrl ?? MODEL_DEFAULT_FILES[selected]}
                scale={draft.scale}
                rotation={draft.rotation}
              />
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="mono-label mb-2 text-muted-foreground">File</p>
                <p className="mb-2 truncate text-xs text-muted-foreground">
                  {isCustomized ? "Custom upload" : "Built-in default"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={(e) => void handleFileChange(e)}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="mono-label inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {uploading ? "Uploading…" : "Upload replacement"}
                  </button>
                  {draft.modelUrl !== null ? (
                    <button
                      type="button"
                      onClick={resetFileToDefault}
                      className="mono-label inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      Use default file
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="mono-label text-muted-foreground">Scale</p>
                  <button
                    type="button"
                    onClick={resetTransformToDefault}
                    className="mono-label inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-3" /> reset transform
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AXIS_LABELS.map((axis, i) => (
                    <NumberField
                      key={axis}
                      label={axis}
                      value={draft.scale[i as 0 | 1 | 2]}
                      onChange={(v) => updateScale(i as 0 | 1 | 2, v)}
                      step={0.1}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mono-label mb-2 text-muted-foreground">Rotation (degrees)</p>
                <div className="grid grid-cols-3 gap-2">
                  {AXIS_LABELS.map((axis, i) => (
                    <NumberField
                      key={axis}
                      label={axis}
                      value={Math.round(draft.rotation[i as 0 | 1 | 2] * RAD_TO_DEG * 10) / 10}
                      onChange={(v) => updateRotationDeg(i as 0 | 1 | 2, v)}
                      step={1}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={!isDirty || saving}
                  onClick={() => void handleSave()}
                  className="mono-label inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  {isDirty ? "Save changes" : "Saved"}
                </button>
                {isCustomized ? (
                  <button
                    type="button"
                    onClick={() => void handleRevertAll()}
                    className="mono-label rounded-md border border-danger/30 px-4 py-2.5 text-danger transition-colors hover:bg-danger-soft"
                  >
                    Revert to built-in default
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}