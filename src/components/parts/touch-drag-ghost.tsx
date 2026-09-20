import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTouchDrag } from "@/lib/touch-drag";

export function TouchDragGhost() {
  const { draggingPart, point } = useTouchDrag();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !draggingPart || !point) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-[calc(100%+14px)] items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium shadow-lift"
      style={{ left: point.x, top: point.y }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: draggingPart.accent }}
      />
      {draggingPart.name}
    </div>,
    document.body,
  );
}
