import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { BuildState, CategoryId, Part } from "@/data/types";
import { cn } from "@/lib/utils";

const Scene = lazy(() =>
  import("./scene").then((m) => ({ default: m.Scene })),
);

export interface ViewerProps {
  mode: "part" | "build";
  category?: CategoryId;
  build?: BuildState;
  accent?: string;
  highlight?: CategoryId | null;
  className?: string;
  autoRotate?: boolean;
  enableZoom?: boolean;
  freeView?: boolean;
  /** matched is false when the drop landed on the wrong slot or empty space. */
  onDropPart?: (part: Part, matched: boolean) => void;
}

function Fallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="mono-label text-muted-foreground">{label}</span>
    </div>
  );
}

/** Client-only wrapper: three.js is never imported during SSR. */
export function Viewer({ className, ...props }: ViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  useEffect(() => setMounted(true), []);

  const draggable = Boolean(props.onDropPart) && !props.freeView;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-150",
        draggable && dragActive && "ring-2 ring-brand/60",
        className,
      )}
      onDragEnter={draggable ? () => setDragActive(true) : undefined}
      onDragOver={draggable ? (e) => e.preventDefault() : undefined}
      onDragLeave={
        draggable
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
            }
          : undefined
      }
      onDrop={draggable ? () => setDragActive(false) : undefined}
    >
      {mounted ? (
        <Suspense fallback={<Fallback label="Loading 3D viewport" />}>
          <Scene {...props} />
        </Suspense>
      ) : (
        <Fallback label="Initialising viewport" />
      )}
      {draggable && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-brand/5 opacity-0 transition-opacity duration-150",
            dragActive && "opacity-100",
          )}
        >
          <span className="mono-label rounded-full border border-brand/40 bg-card/90 px-3 py-1.5 text-brand">
            Drop to install
          </span>
        </div>
      )}
    </div>
  );
}