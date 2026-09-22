import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import type { CategoryId, Part } from "@/data/types";
import { CATEGORY_FIELDS, type FieldConfig } from "@/lib/admin-part-fields";
import { adminUpsertPart } from "@/lib/functions/catalog.functions";
import { PartCard } from "./part-card";
import { Viewer } from "@/components/three/viewer";

const COMMON_FIELDS: FieldConfig[] = [
  { key: "id", label: "ID (unique)", type: "text" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "highlight", label: "Highlight line", type: "text" },
];

const SCORE_FIELDS: FieldConfig[] = [
  { key: "price", label: "Price (₹)", type: "number", step: 0.01 },
  { key: "rating", label: "Rating", type: "number", step: 0.1 },
  { key: "reviews", label: "Reviews", type: "number" },
  { key: "performance", label: "Performance", type: "number" },
  { key: "popularity", label: "Popularity", type: "number" },
  { key: "power", label: "Power draw (W)", type: "number" },
];

// min/max/hint shown per numeric field — mirrors the zod schema in
// catalog.functions.ts so a bad value gets caught here, inline, instead of
// round-tripping to the server for a generic toast error.
const NUMBER_BOUNDS: Record<string, { min: number; max?: number; hint: string }> = {
  price: { min: 0, hint: "≥ 0" },
  rating: { min: 0, max: 5, hint: "0–5" },
  reviews: { min: 0, hint: "≥ 0, whole number" },
  performance: { min: 0, max: 100, hint: "0–100" },
  popularity: { min: 0, max: 100, hint: "0–100" },
  power: { min: 0, hint: "≥ 0, whole number" },
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toFieldStrings(
  part: Part | null | undefined,
  category: CategoryId,
): Record<string, string> {
  const values: Record<string, string> = {};
  const source = part as unknown as Record<string, unknown> | null | undefined;
  const allFields = [...COMMON_FIELDS, ...SCORE_FIELDS, ...CATEGORY_FIELDS[category]];
  allFields.forEach((field) => {
    const raw = source?.[field.key];
    if (field.type === "boolean") {
      values[field.key] = raw === true ? "true" : "false";
    } else if (field.type === "csv") {
      values[field.key] = Array.isArray(raw) ? raw.join(", ") : "";
    } else {
      values[field.key] = raw === undefined || raw === null ? "" : String(raw);
    }
  });
  values["accent"] = (source?.["accent"] as string | undefined) || "#2f6fe8";
  return values;
}

export function AdminPartForm({
  category,
  initial,
  onSaved,
  onCancel,
}: {
  category: CategoryId;
  initial?: Part | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    toFieldStrings(initial, category),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(initial);
  const categoryFields = CATEGORY_FIELDS[category];

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function applySlug() {
    const brand = values["brand"] ?? "";
    const name = values["name"] ?? "";
    if (!brand && !name) return;
    setField("id", slugify(`${category}-${brand}-${name}`));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!values["id"]?.trim()) next["id"] = "Required";
    if (!values["brand"]?.trim()) next["brand"] = "Required";
    if (!values["name"]?.trim()) next["name"] = "Required";
    for (const [key, bounds] of Object.entries(NUMBER_BOUNDS)) {
      const raw = values[key] ?? "";
      if (raw === "") continue; // caught by "Required" check where applicable
      const n = Number(raw);
      if (Number.isNaN(n)) next[key] = "Not a number";
      else if (n < bounds.min) next[key] = `Must be ≥ ${bounds.min}`;
      else if (bounds.max !== undefined && n > bounds.max) next[key] = `Must be ≤ ${bounds.max}`;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(values["accent"] ?? "")) {
      next["accent"] = "Use a 6-digit hex color";
    }
    return next;
  }

  // Built purely for the live preview card below — PartCard only reads the
  // common fields (accent, brand, name, price, rating, performance) in flat
  // (non-3D) mode, so the category-specific fields being loosely typed here
  // doesn't affect what's actually rendered.
  const previewPart = useMemo(() => {
    return {
      id: values["id"] || "preview",
      category,
      brand: values["brand"] || "Brand",
      name: values["name"] || "Part name",
      price: Number(values["price"]) || 0,
      rating: Number(values["rating"]) || 0,
      reviews: Number(values["reviews"]) || 0,
      performance: Number(values["performance"]) || 0,
      popularity: Number(values["popularity"]) || 0,
      power: Number(values["power"]) || 0,
      highlight: values["highlight"] || "",
      accent: /^#[0-9a-fA-F]{6}$/.test(values["accent"] ?? "") ? values["accent"] : "#2f6fe8",
    } as unknown as Part;
  }, [values, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Fix the highlighted fields before saving");
      return;
    }

    setSaving(true);
    try {
      const fields = [...COMMON_FIELDS, ...SCORE_FIELDS, ...categoryFields];
      const payload: Record<string, unknown> = { category, accent: values["accent"] };
      fields.forEach((field) => {
        const raw = values[field.key] ?? "";
        if (field.type === "number") payload[field.key] = Number(raw) || 0;
        else if (field.type === "boolean") payload[field.key] = raw === "true";
        else if (field.type === "csv") {
          payload[field.key] = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          payload[field.key] = raw;
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await adminUpsertPart({ data: payload as any });
      toast.success(isEditing ? "Part updated" : "Part added");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save part");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: FieldConfig) {
    const bounds = NUMBER_BOUNDS[field.key];
    const error = errors[field.key];
    return (
      <label key={field.key} className="flex flex-col gap-1 text-[13px]">
        <span className="mono-label flex items-center justify-between text-muted-foreground">
          <span>{field.label}</span>
          {bounds ? <span className="text-muted-foreground/60">{bounds.hint}</span> : null}
        </span>
        {field.type === "boolean" ? (
          <input
            type="checkbox"
            checked={values[field.key] === "true"}
            onChange={(e) => setField(field.key, e.target.checked ? "true" : "false")}
            className="size-4 self-start"
          />
        ) : field.type === "select" ? (
          <select
            value={values[field.key] ?? ""}
            onChange={(e) => setField(field.key, e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select…</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            step={field.step}
            min={bounds?.min}
            max={bounds?.max}
            required={field.key === "id" || field.key === "brand" || field.key === "name"}
            disabled={field.key === "id" && isEditing}
            value={values[field.key] ?? ""}
            onChange={(e) => setField(field.key, e.target.value)}
            className={`rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
              error ? "border-danger" : "border-input"
            }`}
          />
        )}
        {error ? <span className="text-[11px] text-danger">{error}</span> : null}
      </label>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
      {/* Live preview — the same big auto-rotating 3D viewer the Compare
          page uses (Viewer mode="part"), plus the flat PartCard every
          builder will see in the picker. Both key off the current accent
          color and category, updating as you edit. */}
      <div>
        <p className="mono-label mb-2 text-muted-foreground">3D preview</p>
        <Viewer
          mode="part"
          category={category}
          accent={previewPart.accent}
          autoRotate
          className="h-[220px] w-full max-w-xs"
        />
      </div>

      <div>
        <p className="mono-label mb-2 text-muted-foreground">Card preview</p>
        <div className="max-w-xs">
          <PartCard part={previewPart} onSelect={() => {}} disabled actionLabel="Preview" />
        </div>
      </div>

      <div>
        <p className="mono-label mb-3 border-b border-border pb-2 text-muted-foreground">
          Identity
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 text-[13px] sm:col-span-2">
            <span className="mono-label flex items-center justify-between text-muted-foreground">
              <span>ID (unique, e.g. cpu-ryzen-7-9800x3d)</span>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={applySlug}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Wand2 className="size-3" /> generate from brand + name
                </button>
              ) : null}
            </span>
            <input
              type="text"
              required
              disabled={isEditing}
              value={values["id"] ?? ""}
              onChange={(e) => setField("id", e.target.value)}
              className={`rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                errors["id"] ? "border-danger" : "border-input"
              }`}
            />
            {errors["id"] ? <span className="text-[11px] text-danger">{errors["id"]}</span> : null}
          </div>
          {renderField(COMMON_FIELDS[1]!)} {/* brand */}
          {renderField(COMMON_FIELDS[2]!)} {/* name */}
          {renderField(COMMON_FIELDS[3]!)} {/* highlight */}
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="mono-label text-muted-foreground">Accent color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(values["accent"] ?? "") ? values["accent"] : "#2f6fe8"}
                onChange={(e) => setField("accent", e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5"
                aria-label="Pick accent color"
              />
              <input
                type="text"
                value={values["accent"] ?? ""}
                onChange={(e) => setField("accent", e.target.value)}
                placeholder="#2f6fe8"
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
                  errors["accent"] ? "border-danger" : "border-input"
                }`}
              />
            </div>
            {errors["accent"] ? (
              <span className="text-[11px] text-danger">{errors["accent"]}</span>
            ) : null}
          </label>
        </div>
      </div>

      <div>
        <p className="mono-label mb-3 border-b border-border pb-2 text-muted-foreground">
          Pricing &amp; scores
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SCORE_FIELDS.map(renderField)}
        </div>
      </div>

      {categoryFields.length > 0 ? (
        <div>
          <p className="mono-label mb-3 border-b border-border pb-2 text-muted-foreground">
            Specs — {category}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categoryFields.map(renderField)}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={saving}
          className="mono-label inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {isEditing ? "Save changes" : "Add part"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mono-label rounded-md border border-border px-4 py-2.5 text-foreground transition-colors hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}