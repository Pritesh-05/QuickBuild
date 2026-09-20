import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  reviews,
  className,
}: {
  value: number;
  reviews?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mono-data inline-flex items-center gap-1.5 text-[12px] text-muted-foreground",
        className,
      )}
    >
      <Star className="size-3.5 fill-warning text-warning" />
      {value.toFixed(1)}
      {reviews !== undefined && (
        <span className="text-muted-foreground/70">
          ({reviews > 999 ? `${(reviews / 1000).toFixed(1)}k` : reviews})
        </span>
      )}
    </span>
  );
}

export function SpecBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-muted">
      <span
        className="block h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          backgroundColor: color ?? "var(--brand)",
        }}
      />
    </span>
  );
}