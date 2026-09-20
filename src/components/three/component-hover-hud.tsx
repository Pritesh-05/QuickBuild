import { Html } from "@react-three/drei";
import type { CategoryId, Part } from "@/data/types";
import { getCategoryMeta } from "@/data/catalog";
import { getPartSpecs } from "@/lib/part-specs";
import { SLOT_POSITIONS } from "./models";

/**
 * Small translucent spec card anchored at the hovered component's slot
 * position. All data comes from the real installed Part (via
 * getPartSpecs) — nothing here is invented. Rendered inside <Canvas> via
 * drei's <Html>, so it tracks the 3D scene but stays screen-aligned.
 */
export function ComponentHoverHud({
  category,
  part,
}: {
  category: CategoryId;
  part: Part;
}) {
  const meta = getCategoryMeta(category);
  const specs = getPartSpecs(part);

  return (
    <Html
      position={SLOT_POSITIONS[category]}
      center
      distanceFactor={8}
      zIndexRange={[40, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="w-44 -translate-y-16 border border-brand/40 bg-background/90 px-3 py-2 shadow-[0_0_20px_rgba(47,111,232,0.25)] backdrop-blur-sm">
        <p className="mono-label text-[9px] text-brand">{meta.shortLabel}</p>
        <p className="truncate text-[11px] font-medium leading-tight">{part.name}</p>
        <div className="mt-1.5 space-y-0.5 border-t border-border pt-1.5">
          {specs.map((s) => (
            <div key={s.label} className="mono-data flex items-center justify-between gap-2 text-[9px]">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="text-foreground">{s.value}</span>
            </div>
          ))}
          <div className="mono-data flex items-center justify-between gap-2 text-[9px]">
            <span className="text-muted-foreground">STATUS</span>
            <span className="text-success">✓ INSTALLED</span>
          </div>
        </div>
      </div>
    </Html>
  );
}