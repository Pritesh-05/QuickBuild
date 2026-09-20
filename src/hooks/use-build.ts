import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import type { BuildState, CategoryId, Part, PartByCategory } from "@/data/types";
import { analyzeBuild, EMPTY_BUILD } from "@/lib/compatibility";
import { getBuild, saveBuild } from "@/lib/functions/builds.functions";
import type { Prebuild } from "@/data/prebuilds";
import { useCatalog } from "./use-catalog";

const STORAGE_KEY = "quickbuild.build.v1";

function hydrate(
  ids: Partial<Record<CategoryId, string>>,
  catalog: Record<CategoryId, Part[]>,
): BuildState {
  const next: BuildState = { ...EMPTY_BUILD };
  (Object.keys(ids) as CategoryId[]).forEach((category) => {
    const id = ids[category];
    if (!id) return;
    const found = catalog[category]?.find((p) => p.id === id);
    if (found) {
      // Catalog lists are category-homogeneous, so this narrowing is safe.
      next[category] = found as never;
    }
  });
  return next;
}

export function useBuild() {
  const { data: catalog } = useCatalog();
  // Signed-out visitors share the plain key (no cross-account leak risk —
  // there's no "account" to leak between). Signed-in, the in-progress
  // build has to be scoped per user id, or whoever's logged in next on
  // this browser/device sees the previous person's unsaved build the
  // moment they open /build — which is exactly what was happening before
  // this scoping existed.
  const { user } = useRouteContext({ from: "__root__" });
  const storageKey = user?.id ? `${STORAGE_KEY}.${user.id}` : STORAGE_KEY;

  const [build, setBuild] = useState<BuildState>(EMPTY_BUILD);
  const [loaded, setLoaded] = useState(false);
  // Tracks which saved-to-account build (if any) is currently loaded, so
  // "Save build" updates that row instead of always creating a new one.
  const [currentSave, setCurrentSave] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setBuild(hydrate(JSON.parse(raw), catalog));
      else setBuild(EMPTY_BUILD);
    } catch {
      /* ignore malformed local state */
    }
    setLoaded(true);
    // Deliberately re-runs when storageKey changes (i.e. when the signed-in
    // user changes) — that's the whole point. Catalog swapping from static
    // to DB data isn't worth re-running hydration for, and would fight the
    // user's own edits, so it stays out of the deps on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    const ids: Partial<Record<CategoryId, string>> = {};
    (Object.keys(build) as CategoryId[]).forEach((c) => {
      const part = build[c];
      if (part) ids[c] = part.id;
    });
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }, [build, loaded, storageKey]);

  const setPart = useCallback((part: Part) => {
    setBuild((prev) => ({ ...prev, [part.category]: part }) as BuildState);
  }, []);

  const removePart = useCallback((category: CategoryId) => {
    setBuild((prev) => ({ ...prev, [category]: null }) as BuildState);
  }, []);

  const clearBuild = useCallback(() => {
    setBuild(EMPTY_BUILD);
    setCurrentSave(null);
  }, []);

  /** Replaces the active build with a curated prebuild's parts. Counts as a
   * fresh, unsaved build — not tied to any existing saved-build row. */
  const loadPreset = useCallback(
    (preset: Prebuild) => {
      setBuild(hydrate(preset.parts, catalog));
      setCurrentSave(null);
    },
    [catalog],
  );

  const report = useMemo(() => analyzeBuild(build), [build]);

  /** Persists the current build to the signed-in user's account (Postgres).
   * Updates the currently-loaded save (renaming it if the name changed)
   * unless `saveAsNew` is set, in which case it always creates a new row. */
  const saveToAccount = useCallback(
    async (name: string, options?: { saveAsNew?: boolean }) => {
      const ids: Partial<Record<CategoryId, string>> = {};
      (Object.keys(build) as CategoryId[]).forEach((c) => {
        const part = build[c];
        if (part) ids[c] = part.id;
      });
      const id = options?.saveAsNew ? undefined : currentSave?.id;
      const saved = await saveBuild({ data: { ...(id ? { id } : {}), name, build: ids } });
      setCurrentSave({ id: saved.id, name });
      return saved;
    },
    [build, currentSave],
  );

  /** Loads a build saved to the user's account by id and makes it the active build. */
  const loadSavedBuild = useCallback(async (id: string) => {
    const saved = await getBuild({ data: id });
    if (saved) {
      setBuild(saved.build);
      setCurrentSave({ id: saved.id, name: saved.name });
    }
    return saved;
  }, []);

  /** Adopts an already-resolved build (e.g. from a shared-build link) as the
   * active, unsaved build — so "Save build" creates a fresh row rather than
   * overwriting whatever the original owner saved. */
  const adoptBuild = useCallback((next: BuildState) => {
    setBuild(next);
    setCurrentSave(null);
  }, []);

  return {
    build,
    catalog,
    setPart,
    removePart,
    clearBuild,
    loadPreset,
    report,
    loaded,
    saveToAccount,
    loadSavedBuild,
    adoptBuild,
    currentSave,
  };
}

export type UseBuild = ReturnType<typeof useBuild>;
export type { PartByCategory };