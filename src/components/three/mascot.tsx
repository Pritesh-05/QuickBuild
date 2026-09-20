import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { cn } from "@/lib/utils";

/** Mirrors the project's existing IssueLevel ('ok' | 'warning' | 'error')
 * so the mascot can react to the real build status instead of a second,
 * invented scoring system. */
export type MascotStatus = "ok" | "warning" | "error";

const STATUS_ACCENT: Record<MascotStatus, string> = {
  ok: "#3fe0c8",
  warning: "#f5a623",
  error: "#e0473f",
};

const STATUS_PULSE: Record<MascotStatus, number> = {
  ok: 1,
  warning: 1.6,
  error: 2.4,
};

function MascotHead({ status }: { status: MascotStatus }) {
  const group = useRef<Group>(null);
  const visor = useRef<Mesh>(null);
  const ring = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const accent = STATUS_ACCENT[status];
  const pulseSpeed = STATUS_PULSE[status];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Continuous slow spin, plus a gentle float.
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.1) * 0.05;
      group.current.rotation.y += delta * 0.6;
    }

    // Visor brightness pulses faster the more attention the build needs.
    if (visor.current) {
      const mat = visor.current.material as MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 1.3 + Math.sin(t * pulseSpeed) * 0.45;
      }
    }
    if (glow.current) {
      const mat = glow.current.material as MeshStandardMaterial;
      if (mat.opacity !== undefined) {
        mat.opacity = 0.35 + Math.sin(t * pulseSpeed) * 0.15;
      }
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.35;
    }
  });

  return (
    <group ref={group}>
      {/* Flat, beveled drone shell — reads as a head, not a ball */}
      <RoundedBox args={[0.66, 0.46, 0.5]} radius={0.16} smoothness={4} castShadow>
        <meshPhysicalMaterial
          color="#12151b"
          metalness={0.85}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* Recessed bezel so the visor sits inset, not glued on */}
      <RoundedBox
        args={[0.5, 0.2, 0.06]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.02, 0.25]}
      >
        <meshStandardMaterial color="#05060a" metalness={0.6} roughness={0.5} />
      </RoundedBox>

      {/* Cyan glowing visor/eye, inset within the bezel */}
      <mesh ref={visor} position={[0, 0.02, 0.285]}>
        <boxGeometry args={[0.4, 0.1, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>

      {/* Chin vent slit */}
      <mesh position={[0, -0.16, 0.26]}>
        <boxGeometry args={[0.28, 0.02, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>

      {/* Twin antenna prongs on top */}
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0.28, -0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.012, 0.016, 0.16, 8]} />
            <meshStandardMaterial color="#2a2f38" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Side accent vents, matching the app's accent-strip language */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.03, 0.16, 0.32]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Thin holographic ring beneath, slowly spinning */}
      <group ref={ring} position={[0, -0.3, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.36, 0.006, 8, 48]} />
          <meshBasicMaterial color={accent} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Soft hover-glow underneath — sells the "floating" read */}
      <mesh ref={glow} position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      <pointLight color={accent} intensity={1.4} distance={2.2} position={[0, 0, 0.4]} />
      <pointLight color={accent} intensity={0.6} distance={1.5} position={[0, -0.3, 0]} />
    </group>
  );
}

/**
 * Drop-in mascot panel for the build review UI. Pass the project's real
 * build status ('ok' | 'warning' | 'error') so the accent color and pulse
 * speed reflect actual build health.
 *
 * Usage inside the review panel:
 *   <MascotPanel status={report.status} />
 */
export function MascotPanel({
  status = "ok",
  className,
}: {
  status?: MascotStatus;
  className?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none relative size-24 shrink-0 sm:size-28", className)}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0.55, 0.35, 1.5], fov: 32 }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} color="#dbe6ff" />
        <directionalLight position={[-2, -1, -2]} intensity={0.4} color={STATUS_ACCENT[status]} />
        <MascotHead status={status} />
      </Canvas>
    </div>
  );
}