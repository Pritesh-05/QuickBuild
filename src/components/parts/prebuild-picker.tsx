import { Sparkles } from "lucide-react";
import type { CategoryId, Part } from "@/data/types";
import type { Prebuild } from "@/data/prebuilds";
import { currency } from "@/lib/format";

const HERO_CATEGORIES: CategoryId[] = ["cpu", "gpu"];

function summarize(preset: Prebuild, catalog: Record<CategoryId, Part[]>) {
  function findPart(category: CategoryId, id: string | undefined) {
    if (!id) return undefined;
    return catalog[category]?.find((p) => p.id === id);
  }
  const partIds = Object.entries(preset.parts) as [CategoryId, string | undefined][];
  const parts = partIds.map(([category, id]) => findPart(category, id)).filter(Boolean) as Part[];
  const totalPrice = parts.reduce((sum, p) => sum + p.price, 0);
  const heroLine = HERO_CATEGORIES.map((cat) => findPart(cat, preset.parts[cat])?.name)
    .filter(Boolean)
    .join(" · ");
  return { totalPrice, heroLine };
}

export function PrebuildPicker({
  presets,
  catalog,
  onLoad,
}: {
  presets: Prebuild[];
  catalog: Record<CategoryId, Part[]>;
  onLoad: (preset: Prebuild) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-brand" />
        <p className="mono-label text-muted-foreground">Start from a prebuild</p>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {presets.map((preset) => {
          const { totalPrice, heroLine } = summarize(preset, catalog);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onLoad(preset)}
              className="surface-card flex w-64 shrink-0 flex-col gap-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="mono-label text-brand">{preset.tagline}</p>
              <h3 className="text-[15px] font-semibold tracking-[-0.02em]">{preset.name}</h3>
              <p className="mono-data text-[12px] text-muted-foreground">{heroLine}</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {preset.description}
              </p>
              <p className="mono-data mt-1 text-[15px] font-semibold">{currency(totalPrice)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
