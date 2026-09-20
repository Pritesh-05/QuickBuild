import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { GltfModel } from "@/components/three/gltf-model";

class PreviewErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[model-preview] failed to load model:", error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Standalone rotate-to-inspect preview of a single .glb/.gltf file, at
 * given scale/rotation — used by the admin Models page so an admin can see
 * exactly what they're about to save before saving it. Same SSR-guard +
 * Suspense + error-boundary shape as BuildCharacter (see
 * src/components/build/build-character.tsx) — a bad upload here shows an
 * inline error, never crashes the admin console.
 */
export function ModelPreviewCanvas({
  url,
  scale,
  rotation,
}: {
  url: string;
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <CenteredMessage>
        <Loader2 className="size-5 animate-spin" />
      </CenteredMessage>
    );
  }

  return (
    <PreviewErrorBoundary
      fallback={
        <CenteredMessage>
          <TriangleAlert className="size-5" />
          <p className="mono-label">Couldn't load this file</p>
        </CenteredMessage>
      }
    >
      <Suspense
        fallback={
          <CenteredMessage>
            <Loader2 className="size-5 animate-spin" />
          </CenteredMessage>
        }
      >
        <Canvas
          key={url}
          dpr={[1, 1.5]}
          camera={{ position: [2.2, 1.6, 2.6], fov: 38 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 4, 3]} intensity={1.4} />
          <directionalLight position={[-3, 1, -2]} intensity={0.4} color="#b9ccff" />
          <GltfModel url={url} scale={scale} rotation={rotation} />
          <OrbitControls enablePan={false} minDistance={1.2} maxDistance={8} />
        </Canvas>
      </Suspense>
    </PreviewErrorBoundary>
  );
}