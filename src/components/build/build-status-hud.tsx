import { CATEGORIES } from "@/data/catalog";
import type { BuildState } from "@/data/types";
import type { IssueLevel } from "@/lib/compatibility";
import { cn } from "@/lib/utils";

/**
 * Compact "SYSTEM STATUS" readout for the review panel. Takes only data
 * the project already computes (build state + the existing compatibility
 * status) — it does not duplicate the full component list or invent a
 * second validation pass.
 *
 * `complete` should be the same "all required categories filled" check
 * build.tsx already uses for its progress bar (progress === 100).
 */
export function BuildStatusHud({
  build,
  status,
  complete,
}: {
  build: BuildState;
  status: IssueLevel;
  complete: boolean;
}) {
  const overallLabel = !complete
    ? "INCOMPLETE"
    : status === "ok"
      ? "OPTIMAL"
      : status === "warning"
        ? "NEEDS ATTENTION"
        : "CONFLICTS FOUND";

  const overallClass = !complete
    ? "text-muted-foreground"
    : status === "ok"
      ? "text-success"
      : status === "warning"
        ? "text-warning"
        : "text-destructive";

  const required = CATEGORIES.filter((c) => c.required);

  return (
    <div className="border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="mono-label text-brand">system status</p>
      <ul className="mt-2 space-y-1">
        {required.map((c) => {
          const installed = Boolean(build[c.id]);
          return (
            <li
              key={c.id}
              className="mono-data flex items-center justify-between text-[11px] leading-relaxed"
            >
              <span className={installed ? "text-foreground" : "text-muted-foreground"}>
                {c.shortLabel}
              </span>
              <span className={installed ? "text-success" : "text-muted-foreground"}>
                {installed ? "✓" : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <p className="mono-label text-muted-foreground">build status</p>
        <p className={cn("mono-data text-[12px] font-semibold", overallClass)}>{overallLabel}</p>
      </div>
    </div>
  );
}