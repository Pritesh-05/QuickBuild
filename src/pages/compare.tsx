import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Home, Search, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { useCatalog } from "@/hooks/use-catalog";
import type { CategoryId, Part } from "@/data/types";
import { SPEC_ROWS } from "@/lib/specs";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PartCard } from "@/components/parts/part-card";
import { PartVisual } from "@/components/parts/part-visual";
import { PartIcon } from "@/components/parts/part-icon";
import { Viewer } from "@/components/three/viewer";

const MAX = 3;
type SortKey = "performance" | "price-asc" | "price-desc" | "rating";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "performance", label: "Performance" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "rating", label: "Rating" },
];

export function ComparePage({ initialCategory }: { initialCategory: CategoryId }) {
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [selected, setSelected] = useState<Part[]>([]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("performance");

  const { data: catalog } = useCatalog();

  const brands = useMemo(
    () => Array.from(new Set(catalog[category].map((p) => p.brand))).sort(),
    [catalog, category],
  );

  const parts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog[category].filter(
      (p) =>
        (!brand || p.brand === brand) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.highlight.toLowerCase().includes(q)),
    );
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.performance - a.performance;
    });
    return sorted;
  }, [catalog, category, query, brand, sort]);

  const rows = SPEC_ROWS[category];

  function switchCategory(id: CategoryId) {
    setCategory(id);
    setSelected([]);
    setBrand(null);
    setQuery("");
  }

  function toggle(part: Part) {
    setSelected((prev) => {
      if (prev.some((p) => p.id === part.id)) return prev.filter((p) => p.id !== part.id);
      if (prev.length >= MAX) return [...prev.slice(1), part];
      return [...prev, part];
    });
  }

  const winners = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (selected.length < 2) return map;
    for (const row of rows) {
      if (row.better === "none" || !row.value) continue;
      const vals = selected
        .map((p) => ({ id: p.id, v: row.value!(p) }))
        .filter((x): x is { id: string; v: number } => x.v !== null);
      if (vals.length < 2) continue;
      const best =
        row.better === "higher"
          ? Math.max(...vals.map((x) => x.v))
          : Math.min(...vals.map((x) => x.v));
      map[row.key] = vals.filter((x) => x.v === best).map((x) => x.id);
    }
    return map;
  }, [selected, rows]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:py-14">
      <Link
        to="/"
        className="mono-label inline-flex items-center gap-1.5 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-brand hover:text-brand"
      >
        <Home className="size-3.5" />
        Back to home
      </Link>
      <header className="mt-6 max-w-2xl">
        <p className="mono-label text-brand">Comparison</p>
        <h1 className="display-lg mt-3">Compare Components</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Pick a category, then select up to three parts to see their specifications lined up.
          Winning values are highlighted per row.
        </p>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => switchCategory(c.id)}
            className={cn(
              "mono-label inline-flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2.5 transition-all",
              category === c.id
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <PartIcon category={c.id} className="size-3.5" />
            {c.shortLabel}
          </button>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parts…"
                className="h-11 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </div>
            <div className="flex gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "mono-label rounded-md border px-3 py-2.5 transition-colors",
                    sort === s.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active={brand === null} onClick={() => setBrand(null)}>
              All brands
            </FilterChip>
            {brands.map((b) => (
              <FilterChip
                key={b}
                active={brand === b}
                onClick={() => setBrand(brand === b ? null : b)}
              >
                {b}
              </FilterChip>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {parts.map((part) => (
              <PartCard
                key={part.id}
                part={part}
                selected={selected.some((p) => p.id === part.id)}
                onSelect={toggle}
                actionLabel="Compare"
              />
            ))}
          </div>
          {parts.length === 0 && (
            <p className="mono-data mt-10 text-center text-sm text-muted-foreground">
              No parts match this filter.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Viewer
            mode="part"
            category={category}
            accent={selected[0]?.accent ?? "#2f6fe8"}
            autoRotate
            className="h-[260px] w-full"
          />
          <div className="surface-card mt-4 p-4">
            <div className="flex items-center justify-between">
              <p className="mono-label text-muted-foreground">
                Selected {selected.length}/{MAX}
              </p>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="mono-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Clear
                </button>
              )}
            </div>
            <ul className="mt-3 space-y-2">
              {Array.from({ length: MAX }).map((_, i) => {
                const part = selected[i];
                if (!part)
                  return (
                    <li
                      key={i}
                      className="mono-label flex h-14 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/70"
                    >
                      Slot {i + 1}
                    </li>
                  );
                return (
                  <li
                    key={part.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2"
                  >
                    <PartVisual part={part} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{part.name}</p>
                      <p className="mono-data text-[12px] text-muted-foreground">
                        {currency(part.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(part)}
                      aria-label={`Remove ${part.name}`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              to="/build"
              className="mono-label mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground transition-all hover:shadow-lift active:scale-[0.98]"
            >
              Open PC Builder <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-14">
        <h2 className="display-md">Specification breakdown</h2>
        {selected.length === 0 ? (
          <p className="mono-data mt-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Select at least one component to build the comparison table.
          </p>
        ) : (
          <div className="surface-card mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="mono-label sticky left-0 z-10 bg-card px-5 py-4 text-left text-muted-foreground">
                    Specification
                  </th>
                  {selected.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-left align-bottom">
                      <div className="flex items-center gap-3">
                        <PartVisual part={p} size="sm" />
                        <div>
                          <p className="mono-label text-muted-foreground">{p.brand}</p>
                          <p className="text-[14px] font-semibold tracking-[-0.02em]">{p.name}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-b border-border last:border-0",
                      idx % 2 === 1 && "bg-surface/60",
                    )}
                  >
                    <td className="mono-label sticky left-0 z-10 bg-inherit px-5 py-3.5 text-muted-foreground">
                      {row.label}
                    </td>
                    {selected.map((p) => {
                      const win = winners[row.key]?.includes(p.id);
                      return (
                        <td key={p.id} className="px-5 py-3.5">
                          <span
                            className={cn(
                              "mono-data inline-flex items-center gap-1.5 text-[13px]",
                              win && "font-semibold text-success",
                            )}
                          >
                            {win && <Crown className="size-3.5" />}
                            {row.format(p)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mono-label rounded-full border px-3 py-1.5 transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
