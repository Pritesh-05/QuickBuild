import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import type { CategoryId } from "@/data/types";
import { PartModel } from "./models";
import { cn } from "@/lib/utils";

function SpinningModel({ category, accent }: { category: CategoryId; accent?: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return (
    <group ref={ref} scale={1.5}>
      <PartModel category={category} accent={accent ?? "#2f6fe8"} />
    </group>
  );
}

/**
 * Small always-rotating 3D render of a single part — used in place of the
 * flat product tile on draggable part cards, so what you pick up and drag
 * is the real model rather than an icon. Purely decorative (pointer-events
 * disabled) so it never intercepts the card's native HTML5 drag gesture.
 */
export function PartPreview3D({
  category,
  accent,
  className,
}: {
  category: CategoryId;
  accent?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        "pointer-events-none relative shrink-0 overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
      aria-hidden
    >
      {mounted && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
          camera={{ position: [1.7, 1.3, 1.9], fov: 32 }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 4, 3]} intensity={1.5} />
          <directionalLight position={[-3, 1, -2]} intensity={0.45} color="#b9ccff" />
          <SpinningModel category={category} accent={accent ?? "#2f6fe8"} />
        </Canvas>
      )}
    </div>
  );
}
