import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Raycaster, Vector2 } from "three";
import type { CategoryId, Part } from "@/data/types";
import { useTouchDrag } from "@/lib/touch-drag";

export const PART_DRAG_MIME = "application/quickbuild-part";

export interface DragDropControllerProps {
  onHoverChange: (category: CategoryId | null, valid: boolean) => void;
  /** matched is false when the part was dropped on the wrong slot (or empty space). */
  onDrop: (part: Part, matched: boolean) => void;
}

/**
 * Lives inside <Canvas>. Native HTML5 drag events don't reach react-three-fiber's
 * pointer event system, so we listen on the raw canvas element and raycast
 * manually against the slot hitboxes registered by BuildModel. Also registers
 * the same raycast + drop logic with TouchDragContext, so touch/pen drags
 * (which never fire native drag events) hit-test against the same slots.
 */
export function DragDropController({ onHoverChange, onDrop }: DragDropControllerProps) {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  const draggedCategory = useRef<CategoryId | null>(null);
  const touchDrag = useTouchDrag();

  useEffect(() => {
    const el = gl.domElement;

    function slotAtPoint(clientX: number, clientY: number): CategoryId | null {
      const rect = el.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      const hit = hits.find((h) => h.object.name.startsWith("slot-"));
      return hit ? (hit.object.userData["slotCategory"] as CategoryId) : null;
    }

    function readDraggedCategory(event: DragEvent): CategoryId | null {
      // dataTransfer.getData is unreadable during dragover in most browsers,
      // so the category is mirrored into dataTransfer.types via a prefixed
      // pseudo-type set at dragstart, which IS readable mid-drag.
      const marker = Array.from(event.dataTransfer?.types ?? []).find((t) =>
        t.startsWith("quickbuild/"),
      );
      return marker ? (marker.split("/")[1] as CategoryId) : null;
    }

    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      draggedCategory.current = readDraggedCategory(event);
      const slot = slotAtPoint(event.clientX, event.clientY);
      const valid = Boolean(slot && draggedCategory.current && slot === draggedCategory.current);
      onHoverChange(slot, valid);
    }

    function handleDragLeave() {
      onHoverChange(null, false);
    }

    function handleDrop(event: DragEvent) {
      event.preventDefault();
      onHoverChange(null, false);
      const raw = event.dataTransfer?.getData(PART_DRAG_MIME);
      if (!raw) return;
      try {
        const part = JSON.parse(raw) as Part;
        const slot = slotAtPoint(event.clientX, event.clientY);
        onDrop(part, Boolean(slot && slot === part.category));
      } catch {
        /* ignore malformed payload */
      }
    }

    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("dragleave", handleDragLeave);
    el.addEventListener("drop", handleDrop);

    // Touch/pen path: PartCard's pointer handlers call these through
    // TouchDragContext instead of dispatching native drag events.
    touchDrag.hitTestRef.current = slotAtPoint;
    touchDrag.dropRef.current = onDrop;

    return () => {
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("dragleave", handleDragLeave);
      el.removeEventListener("drop", handleDrop);
      touchDrag.hitTestRef.current = null;
      touchDrag.dropRef.current = null;
    };
  }, [gl, camera, scene, onHoverChange, onDrop, touchDrag]);

  return null;
}
