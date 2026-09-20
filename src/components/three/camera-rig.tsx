import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState, type RefObject } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CategoryId } from "@/data/types";
import { SLOT_POSITIONS } from "./models";
import { useTouchDrag } from "@/lib/touch-drag";

const DEFAULT_TARGET = new Vector3(0.9, -0.2, 0);
const DEFAULT_DIRECTION = new Vector3(0.58, 0.38, 0.72).normalize();
const FOCUS_OFFSET = new Vector3(1.5, 0.9, 1.9);

function getFitDistance(width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const verticalFov = (38 * Math.PI) / 180;

  const requiredVertical =
    4.4 / (2 * Math.tan(verticalFov / 2));

  const requiredHorizontal =
    7.2 /
    (2 * Math.tan(verticalFov / 2) * Math.max(aspect, 0.75));

  return Math.max(requiredVertical, requiredHorizontal) * 1.2;
}

function readDraggedCategory(event: DragEvent): CategoryId | null {
  const marker = Array.from(event.dataTransfer?.types ?? []).find((type) =>
    type.startsWith("quickbuild/"),
  );

  return marker
    ? (marker.split("/")[1] as CategoryId)
    : null;
}

export function CameraRig({
  active,
  controlsRef,
}: {
  active: boolean;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  const [nativeFocusCategory, setNativeFocusCategory] =
    useState<CategoryId | null>(null);

  const touchDrag = useTouchDrag();

  useEffect(() => {
    if (!active) return;

    function handleDragStart(event: DragEvent) {
      const category = readDraggedCategory(event);

      if (category) {
        setNativeFocusCategory(category);
      }
    }

    function handleDragEnd() {
      setNativeFocusCategory(null);
    }

    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
    };
  }, [active]);

  const focusCategory =
    nativeFocusCategory ??
    touchDrag.draggingPart?.category ??
    null;

  /*
   * Fit the complete desktop setup only when the viewport changes.
   * Do not run this continuously in useFrame, otherwise OrbitControls
   * will constantly be pulled back to the default camera position.
   */
  useEffect(() => {
    if (!active || focusCategory) return;

    const distance = getFitDistance(size.width, size.height);

    const nextPosition = DEFAULT_TARGET
      .clone()
      .add(DEFAULT_DIRECTION.clone().multiplyScalar(distance));

    camera.position.copy(nextPosition);
    camera.lookAt(DEFAULT_TARGET);

    const controls = controlsRef.current;

    if (controls) {
      controls.target.copy(DEFAULT_TARGET);
      controls.enabled = true;
      controls.update();
    }
  }, [
    active,
    camera,
    controlsRef,
    focusCategory,
    size.width,
    size.height,
  ]);

  /*
   * During drag, smoothly focus the relevant slot so the user can
   * clearly see where the part should be dropped.
   */
  useFrame(() => {
    if (!active) return;

    const controls = controlsRef.current;

    if (!focusCategory) {
      if (controls) {
        controls.enabled = true;
      }

      return;
    }

    const targetPosition = new Vector3(
      ...SLOT_POSITIONS[focusCategory],
    ).add(FOCUS_OFFSET);

    const targetLook = new Vector3(
      ...SLOT_POSITIONS[focusCategory],
    );

    camera.position.lerp(targetPosition, 0.09);
    camera.lookAt(targetLook);

    if (controls) {
      controls.enabled = false;
      controls.target.lerp(targetLook, 0.09);
      controls.update();
    }
  });

  return null;
}