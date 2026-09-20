import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { getCategoryMeta } from "@/data/catalog";
import type { CategoryId } from "@/data/types";
import { cn } from "@/lib/utils";

export interface InstallFeedbackEvent {
  id: number;
  category: CategoryId;
  ok: boolean;
}

export function InstallFeedbackHud({ event }: { event: InstallFeedbackEvent | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(timer);
  }, [event]);

  if (!event) return null;
  const meta = getCategoryMeta(event.category);

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 transition-all duration-300 sm:top-4 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`mono-label flex items-center gap-2 border px-3 py-1.5 backdrop-blur-sm ${
          event.ok
            ? "border-success/50 bg-success/10 text-success"
            : "border-destructive/50 bg-destructive/10 text-destructive"
        }`}
      >
        {event.ok ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
        {event.ok ? `${meta.shortLabel} INSTALLED` : `INVALID ${meta.shortLabel} SLOT`}
      </div>
    </div>
  );
}