import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Cpu,
  GripVertical,
  Home,
  Maximize2,
  Menu,
  Minimize2,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingCart,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { CATEGORIES } from "@/data/catalog";
import type { BuildState, CategoryId, Part } from "@/data/types";
import { useBuild } from "@/hooks/use-build";
import type { IssueLevel } from "@/lib/compatibility";
import { currency, watts } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PartIcon } from "@/components/parts/part-icon";
import { PrebuildPicker } from "@/components/parts/prebuild-picker";
import { TouchDragGhost } from "@/components/parts/touch-drag-ghost";
import { TouchDragProvider, useTouchDrag } from "@/lib/touch-drag";
import { PREBUILDS, type Prebuild } from "@/data/prebuilds";
import { Viewer } from "@/components/three/viewer";
import { BuildReviewPanel } from "@/components/build/build-review";
import { BuildStatusHud } from "@/components/build/build-status-hud";
import {
  InstallFeedbackHud,
  type InstallFeedbackEvent,
} from "@/components/build/install-feedback-hud";
import { MascotPanel } from "@/components/three/mascot";
import { SHARED_HANDOFF_KEY, LOAD_BUILD_HANDOFF_KEY } from "@/lib/shared-build-handoff";

export function BuildPage() {
  return (
    <TouchDragProvider>
      <Console />
      <TouchDragGhost />
    </TouchDragProvider>
  );
}

function Console() {
  const {
    build,
    catalog,
    setPart,
    removePart,
    clearBuild,
    loadPreset,
    adoptBuild,
    report,
    saveToAccount,
    loadSavedBuild,
    currentSave,
  } = useBuild();
  const [active, setActive] = useState<CategoryId>("cpu");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallFeedbackEvent | null>(null);
  const { user } = useRouteContext({ from: "__root__" });
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(SHARED_HANDOFF_KEY);
    if (!raw) return;
    sessionStorage.removeItem(SHARED_HANDOFF_KEY);
    try {
      adoptBuild(JSON.parse(raw) as BuildState);
      toast.success("Shared build loaded — save it to keep your own copy");
    } catch {
      /* malformed hand-off, ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handles "Load" from the /account page — see the comment on
  // LOAD_BUILD_HANDOFF_KEY in lib/shared-build-handoff.ts for why this has
  // to happen here (this component's own useBuild() instance) rather than
  // on /account itself.
  useEffect(() => {
    const id = sessionStorage.getItem(LOAD_BUILD_HANDOFF_KEY);
    if (!id) return;
    sessionStorage.removeItem(LOAD_BUILD_HANDOFF_KEY);
    loadSavedBuild(id)
      .then((saved) => {
        if (saved) toast.success("Build loaded");
        else toast.error("That saved build couldn't be found");
      })
      .catch(() => toast.error("Couldn't load that build"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!user) {
      void router.navigate({ to: "/login" });
      return;
    }
    const name = window.prompt(
      currentSave ? "Update this build's name" : "Name this build",
      currentSave?.name ?? "My Build",
    );
    if (!name) return;
    setSaving(true);
    try {
      await saveToAccount(name);
      toast.success(currentSave ? "Build updated" : "Build saved to your account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save build");
    } finally {
      setSaving(false);
    }
  }

  function handleLoadPreset(preset: Prebuild) {
    loadPreset(preset);
    setPresetsOpen(false);
    toast.success(`${preset.name} loaded`);
  }

  const parts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog[active].filter(
      (p) =>
        (!brand || p.brand === brand) &&
        (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)),
    );
  }, [catalog, active, query, brand]);

  const brands = useMemo(
    () => Array.from(new Set(catalog[active].map((p) => p.brand))).sort(),
    [catalog, active],
  );

  const requiredCategories = useMemo(() => CATEGORIES.filter((c) => c.required), []);
  const completed = requiredCategories.filter((c) => build[c.id]).length;
  const progress = Math.round((completed / requiredCategories.length) * 100);
  const activeMeta = CATEGORIES.find((c) => c.id === active)!;

  // Pop the review the moment a build actually reaches 100%
  const prevProgressRef = useRef(progress);
  useEffect(() => {
    if (prevProgressRef.current < 100 && progress === 100) {
      setReviewOpen(true);
    }
    prevProgressRef.current = progress;
  }, [progress]);

  function copySummary() {
    const lines = CATEGORIES.map((c) => {
      const p = build[c.id];
      return `${c.shortLabel.padEnd(5)} ${p ? `${p.brand} ${p.name} — ${currency(p.price)}` : "—"}`;
    });
    lines.push(
      "",
      `Total: ${currency(report.totalPrice)}`,
      `Estimated draw: ${watts(report.estimatedPower)} (PSU ${watts(report.recommendedPsu)}+ recommended)`,
    );
    void navigator.clipboard.writeText(`QuickBuild parts list\n\n${lines.join("\n")}`);
    setCopied(true);
    toast.success("Parts list copied");
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* ── Title rail ─────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-2 py-2 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="flex size-9 shrink-0 items-center justify-center border border-border transition-colors hover:border-brand hover:text-brand"
          >
            <Menu className="size-4" />
          </button>
          <Link
            to="/"
            title="Back to home"
            aria-label="Back to home"
            className="mono-label flex h-9 shrink-0 items-center gap-1.5 border border-border px-2 text-muted-foreground transition-colors hover:border-brand hover:text-brand sm:px-3"
          >
            <Home className="size-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <p className="mono-label hidden truncate text-muted-foreground sm:block">
            <span className="text-brand">build</span> // {currentSave?.name ?? "untitled rig"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/free-view"
            title="Free View Mode"
            className="mono-label flex h-9 items-center justify-center border border-border px-2 transition-colors hover:border-brand hover:text-brand sm:px-3"
          >
            <span className="hidden sm:inline">FREE VIEW</span>
            <Box className="size-4 sm:hidden" />
          </Link>
          
          <button
            type="button"
            title="Save Build"
            onClick={() => void handleSave()}
            disabled={saving}
            className="mono-label inline-flex h-9 items-center justify-center gap-1.5 bg-brand px-2.5 text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:gap-2 sm:px-3"
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">
              {saving ? "Saving…" : currentSave ? "Update" : "Save"}
            </span>
          </button>
          <button
            type="button"
            title="Review & Share"
            aria-label="Review & share build"
            onClick={() => setReviewOpen(true)}
            className="flex size-9 items-center justify-center border border-border transition-colors hover:border-brand hover:text-brand"
          >
            <ClipboardList className="size-4" />
          </button>
          <button
            type="button"
            aria-label={expanded ? "Exit fullscreen viewport" : "Fullscreen viewport"}
            onClick={() => setExpanded((v) => !v)}
            className="hidden size-9 items-center justify-center border border-border transition-colors hover:border-brand hover:text-brand sm:flex"
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </header>

      {/* ── Workspace ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        
        {/* Viewport */}
        <section
          className={cn(
            "relative min-h-0 shrink-0 overflow-hidden border-b border-border transition-all duration-300 lg:border-b-0 lg:border-r",
            expanded ? "flex-1" : "h-[45dvh] lg:h-auto lg:flex-1"
          )}
        >
          <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-30" />
          
          <Viewer
            mode="build"
            build={build}
            highlight={active}
            className="h-full w-full rounded-none border-0 bg-transparent"
            onDropPart={(part, matched) => {
              if (matched) {
                setPart(part);
              }
              setInstallEvent({ id: Date.now(), category: part.category, ok: matched });
            }}
          />

          <InstallFeedbackHud event={installEvent} />

          {/* Slot rail */}
          <div className="no-scrollbar pointer-events-auto absolute bottom-2 left-2 z-20 flex max-w-[calc(100vw-16px)] flex-row overflow-x-auto border border-border bg-border sm:bottom-auto sm:left-3 sm:top-3 sm:max-w-none sm:flex-col gap-px">
            {CATEGORIES.map((c) => {
              const filled = Boolean(build[c.id]);
              const flagged = report.errors.some((i) => i.parts.includes(c.id));
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  onClick={() => {
                    setActive(c.id);
                    setBrand(null);
                    setQuery("");
                  }}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center bg-card/90 backdrop-blur-sm transition-colors",
                    active === c.id && "bg-brand text-brand-foreground",
                    active !== c.id && filled && "text-brand",
                    active !== c.id && !filled && "text-muted-foreground hover:text-foreground",
                    flagged && active !== c.id && "text-destructive",
                  )}
                >
                  <PartIcon category={c.id} className="size-4" />
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute right-2 top-2 z-10 text-right sm:right-3 sm:top-3">
            <p className="mono-label text-muted-foreground">viewport // {activeMeta.code}</p>
            <p className="mono-data mt-1 text-[11px] text-foreground sm:text-[12px]">
              {completed}/{requiredCategories.length} installed
            </p>
          </div>
          
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-2 sm:bottom-3 sm:left-3 sm:top-auto">
            <StatusPill status={report.status} />
            <span className="mono-label hidden text-muted-foreground sm:inline">
              drag a part onto the chassis
            </span>
          </div>
        </section>

        {/* Component list */}
        <aside
          className={cn(
            "flex min-h-0 flex-1 flex-col bg-surface lg:w-[400px] lg:flex-none xl:w-[440px]",
            expanded && "hidden lg:flex"
          )}
        >
          <div className="shrink-0 border-b border-border px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between">
              <p className="mono-label text-brand">component list</p>
              <span className="mono-data text-[12px] text-muted-foreground">
                {parts.length} results
              </span>
            </div>

            <div className="relative mt-2 sm:mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${activeMeta.label.toLowerCase()}...`}
                className="mono-data h-9 w-full border border-border bg-background pl-9 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-brand sm:h-10"
              />
            </div>

            <div className="no-scrollbar mt-2 flex gap-px overflow-x-auto sm:mt-3">
              <Chip active={brand === null} onClick={() => setBrand(null)}>
                All
              </Chip>
              {brands.map((b) => (
                <Chip
                  key={b}
                  active={brand === b}
                  onClick={() => setBrand(brand === b ? null : b)}
                >
                  {b}
                </Chip>
              ))}
            </div>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {parts.map((part) => (
              <PartRow
                key={part.id}
                part={part}
                selected={build[active]?.id === part.id}
                onSelect={() =>
                  build[active]?.id === part.id ? removePart(active) : setPart(part)
                }
              />
            ))}
            {parts.length === 0 && (
              <li className="mono-data px-4 py-8 text-center text-[12px] text-muted-foreground">
                No parts match this filter.
              </li>
            )}
          </ul>

          {report.issues.length > 0 && (
            <div className="shrink-0 border-t-2 border-border bg-card">
              <button
                type="button"
                onClick={() => setIssuesOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-2"
              >
                <span className="flex items-center gap-2">
                  <IssueIcon level={report.status} />
                  <span className="mono-label text-muted-foreground">
                    diagnostics · {report.issues.length}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform",
                    issuesOpen && "rotate-90",
                  )}
                />
              </button>
              {issuesOpen && (
                <ul className="max-h-[22dvh] space-y-1.5 overflow-y-auto border-t border-border bg-background px-4 py-3">
                  {report.issues.map((issue) => (
                    <li key={issue.id} className="flex items-start gap-2">
                      <IssueIcon level={issue.level} />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{issue.title}</span>
                        <span className="mono-data block text-[11px] leading-relaxed text-muted-foreground">
                          {issue.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Status bar ── */}
      <footer className="grid shrink-0 grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        <Metric label="build price" value={currency(report.totalPrice)} accent />
        <Metric label="total wattage" value={watts(report.estimatedPower)} />
        <Metric label="psu advised" value={`${watts(report.recommendedPsu)}+`} />
        <div className="bg-card px-2 py-1 sm:px-4 sm:py-2.5">
          <p className="mono-label text-[9px] text-muted-foreground sm:text-[11px]">completion</p>
          <div className="mt-0.5 flex items-center gap-2 sm:mt-1">
            <span className="block h-1 flex-1 overflow-hidden bg-muted">
              <span
                className="block h-full bg-brand transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="mono-data text-[9px] sm:text-[12px]">{progress}%</span>
          </div>
        </div>
      </footer>

      {/* ── Overlays (Menu, Presets, Review) ───────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="flex-1 bg-background/80 backdrop-blur-sm"
          />
          <nav className="hud-scanlines relative w-[min(22rem,88vw)] overflow-y-auto border-l border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="mono-label text-brand">build &amp; save</p>
              <button type="button" aria-label="Close" onClick={() => setMenuOpen(false)}>
                <X className="size-4" />
              </button>
            </div>

            <ul className="mt-5 space-y-px">
              <MenuAction icon={Sparkles} label="Load a prebuild" onClick={() => setPresetsOpen(true)} />
              <MenuAction
                icon={ClipboardList}
                label="Review & share build"
                onClick={() => {
                  setReviewOpen(true);
                  setMenuOpen(false);
                }}
              />
              <li>
                <Link
                  to="/buy"
                  onClick={() => setMenuOpen(false)}
                  className="mono-label flex w-full items-center gap-3 border border-border px-3 py-3 transition-colors hover:border-brand hover:text-brand"
                >
                  <ShoppingCart className="size-3.5" />
                  Where to buy
                </Link>
              </li>
              <MenuAction icon={copied ? Check : Copy} label="Export parts list" onClick={copySummary} />
              <MenuAction
                icon={RotateCcw}
                label="Reset build"
                onClick={() => {
                  clearBuild();
                  setMenuOpen(false);
                  toast.success("Build cleared");
                }}
              />
            </ul>

            <p className="mono-label mt-7 text-muted-foreground">installed</p>
            <ul className="mt-2 space-y-px">
              {CATEGORIES.filter((c) => build[c.id]).map((c) => {
                const part = build[c.id]!;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 border border-border px-3 py-2.5"
                  >
                    <PartIcon category={c.id} className="size-4 shrink-0 text-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="mono-label block text-muted-foreground">{c.shortLabel}</span>
                      <span className="block truncate text-[13px]">{part.name}</span>
                    </span>
                    <span className="mono-data text-[12px]">{currency(part.price)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${c.label}`}
                      onClick={() => removePart(c.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
              {completed === 0 && (
                <li className="mono-data text-[12px] text-muted-foreground">Nothing installed yet.</li>
              )}
            </ul>

            <p className="mono-label mt-7 text-muted-foreground">go to</p>
            <ul className="mt-2 space-y-px">
              {(
                [
                  { to: "/", label: "Menu screen" },
                  { to: "/compare", label: "Comparison bay" },
                  { to: "/account", label: "Saved builds" },
                ] as const
              ).map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="mono-label flex items-center justify-between border border-border px-3 py-3 transition-colors hover:border-brand hover:text-brand"
                  >
                    {l.label}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {presetsOpen && (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-background/92 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto w-full max-w-4xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="mono-label text-brand">prebuild presets</p>
              <button type="button" aria-label="Close presets" onClick={() => setPresetsOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <PrebuildPicker presets={PREBUILDS} catalog={catalog} onLoad={handleLoadPreset} />
          </div>
        </div>
      )}

      {reviewOpen && (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-background/92 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto w-full max-w-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="mono-label text-brand">build review</p>
              <div className="flex items-center gap-2">
                <MascotPanel status={report.status} />
                <button type="button" aria-label="Close review" onClick={() => setReviewOpen(false)}>
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <BuildStatusHud build={build} status={report.status} complete={progress === 100} />
            </div>
            <div className="mt-4">
              <BuildReviewPanel build={build} buildName={currentSave?.name ?? "My Build"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card px-2 py-1 sm:px-4 sm:py-2.5">
      <p className="mono-label text-[9px] text-muted-foreground sm:text-[11px]">{label}</p>
      <p
        className={cn(
          "mono-data mt-0 text-[12px] font-semibold tracking-[-0.02em] sm:mt-1 sm:text-[17px]",
          accent && "text-brand",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MenuAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="mono-label flex w-full items-center gap-3 border border-border px-3 py-3 transition-colors hover:border-brand hover:text-brand"
      >
        <Icon className="size-3.5" />
        {label}
      </button>
    </li>
  );
}

function PartRow({
  part,
  selected,
  onSelect,
}: {
  part: Part;
  selected: boolean;
  onSelect: () => void;
}) {
  const touchDrag = useTouchDrag();

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/quickbuild-part", JSON.stringify(part));
        e.dataTransfer.setData(`quickbuild/${part.category}`, "1");
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "group flex items-center gap-2 border-b border-border pr-3 transition-colors",
        selected ? "bg-brand-soft" : "hover:bg-accent",
      )}
    >
      {/* ── DRAG HANDLE ── */}
      <div
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          touchDrag.start(part, e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") return;
          e.stopPropagation();
          touchDrag.move(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") return;
          e.stopPropagation();
          touchDrag.drop(e.clientX, e.clientY);
        }}
        onPointerCancel={() => touchDrag.cancel()}
        className="flex h-12 w-10 shrink-0 cursor-grab items-center justify-center bg-background/40 active:cursor-grabbing sm:h-14"
      >
        <GripVertical className="size-4 text-muted-foreground opacity-60" />
      </div>

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center border border-border",
          selected ? "border-brand text-brand" : "text-muted-foreground",
        )}
      >
        <PartIcon category={part.category} className="size-4" />
      </span>

      <span className="min-w-0 flex-1 py-2 pl-1">
        <span className="mono-label block text-[10px] text-muted-foreground sm:text-[11px]">{part.brand}</span>
        <span className="block truncate text-[13px] font-medium leading-snug sm:text-[14px]">{part.name}</span>
        <span className="mono-data block truncate text-[10px] text-muted-foreground sm:text-[11px]">
          {part.highlight} · {part.power}W
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1.5 py-2">
        <span className="mono-data text-[13px] font-semibold sm:text-[14px]">{currency(part.price)}</span>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "mono-label inline-flex items-center gap-1 border px-2 py-1 transition-colors sm:py-1.5",
            selected
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border hover:border-brand hover:text-brand",
          )}
        >
          {selected ? <Check className="size-3" /> : <Plus className="size-3" />}
          {selected ? "In build" : "Install"}
        </button>
      </span>
    </li>
  );
}

function IssueIcon({ level }: { level: IssueLevel }) {
  if (level === "error") return <XCircle className="size-4 shrink-0 text-destructive" />;
  if (level === "warning") return <AlertTriangle className="size-4 shrink-0 text-warning" />;
  return <CheckCircle2 className="size-4 shrink-0 text-success" />;
}

function StatusPill({ status }: { status: IssueLevel }) {
  const map = {
    ok: ["systems nominal", "border-success/40 bg-success/10 text-success"],
    warning: ["advisories", "border-warning/40 bg-warning/10 text-warning"],
    error: ["conflicts", "border-destructive/40 bg-destructive/10 text-destructive"],
  } as const;
  const [label, cls] = map[status];
  return (
    <span className={cn("mono-label border px-2 py-0.5 text-[9px] backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[10px]", cls)}>{label}</span>
  );
}

function Chip({
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
        "mono-label shrink-0 border px-2.5 py-1 text-[10px] transition-colors sm:py-1.5 sm:text-[11px]",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export const CONSOLE_GLYPH = Cpu;