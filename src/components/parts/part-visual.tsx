import type { Part } from "@/data/types";
import { cn } from "@/lib/utils";
import { PartIcon } from "./part-icon";

/**
 * Deterministic product visual. The dataset ships without photography, so each
 * part gets a technical tile derived from its category and brand accent.
 */
export function PartVisual({
  part,
  className,
  size = "md",
}: {
  part: Part;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize =
    size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-5";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface",
        size === "sm" ? "size-10" : size === "lg" ? "size-24" : "size-14",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundColor: part.accent }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, currentColor 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />
      <PartIcon
        category={part.category}
        className={cn("relative", iconSize)}
      />
      <span
        className="absolute bottom-0 left-0 h-0.5 w-full"
        style={{ backgroundColor: part.accent }}
      />
    </div>
  );
}