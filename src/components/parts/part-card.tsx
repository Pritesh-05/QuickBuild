import { Check, Plus } from "lucide-react";
import type { Part } from "@/data/types";
import { cn } from "@/lib/utils";
import { PartVisual } from "./part-visual";
import { Rating, SpecBar } from "./rating";
import { PartPreview3D } from "@/components/three/part-preview-3d";
import { useTouchDrag } from "@/lib/touch-drag";

export function PartCard({
  part,
  selected = false,
  disabled = false,
  onSelect,
  actionLabel = "Select",
  draggable = false,
  preview3D = false,
}: {
  part: Part;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (part: Part) => void;
  actionLabel?: string;
  /** Allows dragging this card onto the 3D build viewer to install it. */
  draggable?: boolean;
  /** Shows a small rotating 3D render of the part instead of the flat icon tile. */
  preview3D?: boolean;
}) {
  const touchDrag = useTouchDrag();

  return (
    <article
      draggable={draggable}
      style={draggable ? { touchAction: "none" } : undefined}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData("application/quickbuild-part", JSON.stringify(part));
              // Mirrors the category into a pseudo MIME type, since
              // getData() is unreadable during dragover — only types is.
              e.dataTransfer.setData(`quickbuild/${part.category}`, "1");
              e.dataTransfer.effectAllowed = "copy";
            }
          : undefined
      }
      onPointerDown={
        draggable
          ? (e) => {
              // Native HTML5 drag events don't fire on touch/pen — this is
              // the parallel path for those input types. Mouse keeps using
              // the native draggable/onDragStart above, untouched.
              if (e.pointerType === "mouse") return;
              e.currentTarget.setPointerCapture(e.pointerId);
              touchDrag.start(part, e.clientX, e.clientY);
            }
          : undefined
      }
      onPointerMove={
        draggable
          ? (e) => {
              if (e.pointerType === "mouse") return;
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              e.preventDefault();
              touchDrag.move(e.clientX, e.clientY);
            }
          : undefined
      }
      onPointerUp={
        draggable
          ? (e) => {
              if (e.pointerType === "mouse") return;
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              touchDrag.drop(e.clientX, e.clientY);
            }
          : undefined
      }
      onPointerCancel={draggable ? () => touchDrag.cancel() : undefined}
      className={cn(
        "group surface-card flex flex-col gap-4 p-4 transition-all duration-300",
        selected
          ? "border-brand shadow-lift ring-1 ring-brand/30"
          : "hover:-translate-y-0.5 hover:shadow-lift",
        disabled && "opacity-55",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-3">
        {preview3D ? (
          <PartPreview3D category={part.category} accent={part.accent} className="size-14" />
        ) : (
          <PartVisual part={part} />
        )}
        <div className="min-w-0 flex-1">
          <p className="mono-label text-muted-foreground">{part.brand}</p>
          <h3 className="mt-1 truncate text-[15px] font-semibold tracking-[-0.02em]">
            {part.name}
          </h3>
          <p className="mono-data mt-1 truncate text-[12px] text-muted-foreground">
            {part.highlight}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="mono-label text-muted-foreground">Performance</span>
          <span className="mono-data text-[12px]">{part.performance}</span>
        </div>
        <SpecBar value={part.performance} color={part.accent} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="mono-data text-[17px] font-semibold tracking-[-0.02em]">
            ${part.price.toFixed(2)}
          </p>
          <Rating value={part.rating} reviews={part.reviews} />
        </div>
        <button
          type="button"
          disabled={disabled && !selected}
          onClick={() => onSelect(part)}
          className={cn(
            "mono-label inline-flex items-center gap-1.5 rounded-md px-3 py-2.5 transition-all active:scale-[0.97]",
            selected
              ? "bg-brand text-brand-foreground"
              : "border border-border bg-card text-foreground hover:bg-accent",
            disabled && !selected && "cursor-not-allowed",
          )}
        >
          {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
          {selected ? "Selected" : actionLabel}
        </button>
      </div>
    </article>
  );
}
