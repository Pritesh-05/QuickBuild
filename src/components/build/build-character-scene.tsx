import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { SkeletonUtils } from "three-stdlib";
import { useModelOverride } from "@/hooks/use-model-overrides";

const MASCOT_URL = "/models/mascot.glb";

// Starts the download as soon as this chunk loads rather than waiting for
// first render, so the panel usually has the model ready by the time it opens.
useGLTF.preload(MASCOT_URL);

function Waveform({ accent, speaking }: { accent: string; speaking: boolean }) {
  const bars = useRef<(Mesh | null)[]>([]);
  const phases = useMemo(() => Array.from({ length: 7 }, () => Math.random() * Math.PI * 2), []);

  useFrame((state) => {
    bars.current.forEach((bar, i) => {
      if (!bar) return;
      const t = state.clock.elapsedTime * 6 + phases[i]!;
      const target = speaking ? 0.15 + Math.abs(Math.sin(t)) * 0.55 : 0.08;
      bar.scale.y += (target - bar.scale.y) * 0.25;
      bar.position.y = (bar.scale.y * 0.9) / 2 - 0.75;
    });
  });

  return (
    <group position={[0, -0.65, 0]}>
      {phases.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          position={[(i - 3) * 0.13, -0.45, 0]}
        >
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

function CharacterModel({ accent }: { accent: string }) {
  const groupRef = useRef<Group>(null);
  const override = useModelOverride("mascot");
  const { scene } = useGLTF(override.modelUrl ?? MASCOT_URL);

  // useGLTF returns one shared scene per URL. Rendering that object directly
  // means two mounted mascots (review modal + share page, or a remount during
  // an exit animation) fight over the same transforms. Clone per instance.
  const model = useMemo(() => SkeletonUtils.clone(scene) as Group, [scene]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={override.scale} rotation={override.rotation}>
      <primitive object={model} />
      <pointLight position={[0, 1, 1]} intensity={2} color={accent} distance={3} />
    </group>
  );
}

export function BuildCharacterScene({ accent, speaking }: { accent: string; speaking: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 3.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={1.5} />
      {/* The waveform is plain geometry and never suspends, so it keeps
          animating while the GLB is still downloading. */}
      <Waveform accent={accent} speaking={speaking} />
      <Suspense fallback={null}>
        <CharacterModel accent={accent} />
      </Suspense>
    </Canvas>
  );
}