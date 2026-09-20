import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Raycaster, Vector2, type Object3D } from "three";
import type { CategoryId } from "@/data/types";
import { useTouchDrag } from "@/lib/touch-drag";

export interface PartHoverControllerProps {
  /** Disable entirely outside normal build mode (e.g. Free View, or while
   * a drag is in progress — DragDropController owns hover state then). */
  enabled: boolean;
  onHoverChange: (category: CategoryId | null) => void;
}

function findPartCategory(object: Object3D): CategoryId | null {
  let current: Object3D | null = object;
  while (current) {
    if (current.name.startsWith("part-")) {
      return current.userData["partCategory"] as CategoryId;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Companion to DragDropController: that one raycasts slot hitboxes during
 * a drag, this one raycasts the installed-part groups (name="part-<cat>",
 * tagged in BuildModel) on plain mouse movement, for the hover-info HUD.
 * Mouse only — touch has no hover concept — and it steps aside completely
 * whenever a drag is active so it never fights the drop-target raycast.
 */
export function PartHoverController({ enabled, onHoverChange }: PartHoverControllerProps) {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  const touchDrag = useTouchDrag();

  useEffect(() => {
    if (!enabled) {
      onHoverChange(null);
      return;
    }

    const el = gl.domElement;

    function handleMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      if (touchDrag.draggingPart) return;

      const rect = el.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      const hit = hits.find((h) => findPartCategory(h.object) !== null);
      onHoverChange(hit ? findPartCategory(hit.object) : null);
    }

    function handleLeave() {
      onHoverChange(null);
    }

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerleave", handleLeave);

    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", handleLeave);
    };
  }, [enabled, gl, camera, scene, touchDrag, onHoverChange]);

  return null;
}