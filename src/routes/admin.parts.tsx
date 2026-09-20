import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Radio, Search, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import type { CategoryId, Part } from "@/data/types";
import { useCatalog } from "@/hooks/use-catalog";
import { adminDeletePart } from "@/lib/functions/catalog.functions";
import { AdminPartForm } from "@/components/parts/admin-part-form";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/parts")({
  component: AdminPartsPage,
});

type SortKey = "name" | "price" | "rating";

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mono-label inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

function AdminPartsPage() {
  const { data: catalog } = useCatalog();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<CategoryId>("cpu");
  const [editing, setEditing] = useState<Part | null | undefined>(undefined); // undefined = form closed
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function refresh() {
    setEditing(undefined);
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  async function handleDelete(part: Part) {
    if (
      !window.confirm(
        `Delete "${part.name}"? This removes it from the live catalog for everyone and can't be undone.`,
      )
    )
      return;
    try {
      await adminDeletePart({ data: part.id });
      toast.success("Part deleted");
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete part");
    }
  }

  const allParts = catalog[category];
  const activeCategory = CATEGORIES.find((c) => c.id === category);

  const parts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allParts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        )
      : allParts;

    const sorted = [...filtered].sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`)
          : a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [allParts, search, sortKey, sortDir]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Live-catalog reminder. This page edits what every builder sees;
          that fact needs to stay on screen the whole time, not just be
          implied by the page title. */}
      <div className="flex items-center gap-2.5 border border-warning/30 bg-warning-soft px-4 py-2.5">
        <Radio className="size-3.5 shrink-0 text-warning" />
        <p className="mono-label text-warning">live catalog</p>
        <p className="mono-data text-[11px] text-warning/80">
          — edits publish immediately, to every builder
        </p>
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em]">Parts catalog</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
        {/* Category rail — a console nav, deliberately not the pill filters
            used to browse parts on the consumer side of the app. */}
        <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:border-r md:border-border md:pb-0 md:pr-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setEditing(undefined);
                setSearch("");
              }}
              className={cn(
                "mono-label flex shrink-0 items-center justify-between gap-3 border-l-2 px-2.5 py-1.5 text-left transition-colors",
                category === c.id
                  ? "border-brand bg-brand-soft text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <span>{c.shortLabel}</span>
              <span className="mono-data text-[10px] text-muted-foreground">
                {catalog[c.id].length}
              </span>
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {editing !== undefined ? (
            <div className="mb-6 border-l-2 border-brand bg-card pl-4">
              <div className="flex items-center justify-between py-2.5 pr-3">
                <p className="mono-label text-muted-foreground">
                  {editing ? `Editing ${editing.name}` : "New part"}
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(undefined)}
                  aria-label="Close form"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="pb-4 pr-3">
                <AdminPartForm
                  category={category}
                  initial={editing}
                  onSaved={refresh}
                  onCancel={() => setEditing(undefined)}
                />
              </div>
            </div>
          ) : (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="mono-label text-muted-foreground">
                {activeCategory?.shortLabel} · {parts.length}
                {parts.length !== allParts.length ? ` of ${allParts.length}` : ""} listed
              </p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search this category…"
                    className="w-48 rounded-md border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="mono-label inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="size-3.5" /> Add part
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-left font-normal">
                    <SortHeader
                      label="Part"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </th>
                  <th className="py-2 pl-4 text-right font-normal">
                    <SortHeader
                      label="Price"
                      active={sortKey === "price"}
                      dir={sortDir}
                      onClick={() => toggleSort("price")}
                      align="right"
                    />
                  </th>
                  <th className="py-2 pl-4 text-right font-normal">
                    <SortHeader
                      label="Rating"
                      active={sortKey === "rating"}
                      dir={sortDir}
                      onClick={() => toggleSort("rating")}
                      align="right"
                    />
                  </th>
                  <th className="mono-label py-2 pl-4 text-left font-normal">ID</th>
                  <th className="w-[84px] py-2 pl-4" />
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr
                    key={part.id}
                    className="border-b border-border/60 transition-colors hover:bg-accent/40"
                  >
                    <td className="max-w-0 py-2.5 pr-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {part.brand} {part.name}
                      </p>
                    </td>
                    <td className="mono-data whitespace-nowrap py-2.5 pl-4 text-right text-[12px] text-foreground">
                      {currency(part.price)}
                    </td>
                    <td className="mono-data whitespace-nowrap py-2.5 pl-4 text-right text-[12px] text-muted-foreground">
                      {part.rating.toFixed(1)}
                    </td>
                    <td className="mono-data whitespace-nowrap py-2.5 pl-4 text-[11px] text-muted-foreground">
                      {part.id}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(part)}
                          aria-label="Edit part"
                          className="inline-flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(part)}
                          aria-label="Delete part"
                          className="inline-flex size-8 items-center justify-center rounded-md border border-danger/30 text-danger transition-colors hover:bg-danger-soft"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parts.length === 0 ? (
            <p className="mono-label py-8 text-center text-muted-foreground">
              {search
                ? `No parts in ${activeCategory?.shortLabel} match "${search}".`
                : `No parts in ${activeCategory?.shortLabel} yet.`}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}