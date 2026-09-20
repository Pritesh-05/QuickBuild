import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import { BoxGeometry, type Group, type Mesh } from "three";
import type { BuildState, CategoryId } from "@/data/types";
import { GltfModel } from "./gltf-model";
import { MODEL_DEFAULT_FILES } from "@/data/model-defaults";
import { useModelOverride } from "@/hooks/use-model-overrides";

// Slots a part can be dragged onto directly in the 3D view. "case" is
// excluded — it's the whole chassis and would swallow every raycast.
const DROPPABLE_SLOTS: CategoryId[] = [
  "motherboard",
  "cpu",
  "cooler",
  "ram",
  "gpu",
  "storage",
  "psu",
  "monitor",
  "keyboard",
  "mouse",
];

const METAL = "#c9ced8";
const DARK = "#20242c";
const PCB = "#28553c";
const GOLD = "#c9a227";

function Spin({
  children,
  speed = 0.25,
  bob = true,
}: {
  children: React.ReactNode;
  speed?: number;
  bob?: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    if (bob) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06;
    }
  });
  return <group ref={ref}>{children}</group>;
}

export function CpuModel({ accent = "#2f6fe8" }: { accent?: string }) {
  return (
    <Spin>
      <group>
        <RoundedBox args={[1.9, 0.14, 1.9]} radius={0.03} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.45} />
        </RoundedBox>
        <RoundedBox
          args={[1.15, 0.09, 1.15]}
          radius={0.02}
          smoothness={4}
          position={[0, 0.11, 0]}
          castShadow
        >
          <meshStandardMaterial color={METAL} metalness={0.95} roughness={0.18} />
        </RoundedBox>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.55, 0.01, 0.14]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[-0.8 + i * 0.145, -0.09, 0]} castShadow>
            <boxGeometry args={[0.05, 0.04, 1.6]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </Spin>
  );
}

export function GpuModel({ accent = "#4a9e2f" }: { accent?: string }) {
  return (
    <Spin speed={0.22}>
      <group rotation={[0.1, 0, 0]}>
        <RoundedBox args={[3.1, 0.6, 1.35]} radius={0.06} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0.31, 0]}>
          <boxGeometry args={[2.9, 0.03, 1.2]} />
          <meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.3} />
        </mesh>
        {[-0.78, 0.78].map((x) => (
          <group key={x} position={[x, 0.33, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.08, 32]} />
              <meshStandardMaterial color="#15181e" roughness={0.5} />
            </mesh>
            <FanBlades accent={accent} />
          </group>
        ))}
        <mesh position={[0, -0.38, 0.2]}>
          <boxGeometry args={[1.5, 0.16, 0.9]} />
          <meshStandardMaterial color="#171a20" roughness={0.6} />
        </mesh>
        <mesh position={[0.2, -0.44, 0]} castShadow>
          <boxGeometry args={[1.6, 0.12, 0.16]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.05, -0.69]}>
          <boxGeometry args={[1.4, 0.12, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
      </group>
    </Spin>
  );
}

function FanBlades({ accent }: { accent: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 4;
  });
  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} rotation={[0, (i / 7) * Math.PI * 2, 0.35]}>
          <boxGeometry args={[0.36, 0.012, 0.12]} />
          <meshStandardMaterial color={accent} roughness={0.4} />
        </mesh>
      ))}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
        <meshStandardMaterial color="#0f1216" />
      </mesh>
    </group>
  );
}

export function MotherboardModel({ accent = "#3c4a63" }: { accent?: string }) {
  return (
    <Spin speed={0.2}>
      <group rotation={[-0.15, 0, 0]}>
        <RoundedBox args={[2.6, 0.08, 2.2]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={PCB} roughness={0.7} />
        </RoundedBox>
        <mesh position={[-0.5, 0.09, 0.2]} castShadow>
          <boxGeometry args={[0.7, 0.1, 0.7]} />
          <meshStandardMaterial color="#3a3f47" metalness={0.8} roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0.45 + i * 0.16, 0.16, 0.1]} castShadow>
            <boxGeometry args={[0.06, 0.24, 1.4]} />
            <meshStandardMaterial color={accent} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[-0.2, 0.1, -0.75]}>
          <boxGeometry args={[1.8, 0.06, 0.16]} />
          <meshStandardMaterial color="#8a8f99" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.1, -0.35]}>
          <boxGeometry args={[1.2, 0.03, 0.1]} />
          <meshStandardMaterial color="#c2c8d2" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </Spin>
  );
}

export function RamModel({ accent = "#6b4ae8" }: { accent?: string }) {
  return (
    <Spin speed={0.3}>
      <group>
        {[-0.28, 0.28].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <RoundedBox
              args={[0.16, 1.4, 2.4]}
              radius={0.03}
              smoothness={4}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#23272f" metalness={0.6} roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.74, 0]}>
              <boxGeometry args={[0.14, 0.08, 2.2]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, -0.72, 0]}>
              <boxGeometry args={[0.1, 0.08, 2.2]} />
              <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </Spin>
  );
}

export function StorageModel({ accent = "#1f7a8c" }: { accent?: string }) {
  return (
    <Spin speed={0.3}>
      <group rotation={[-0.2, 0, 0]}>
        <RoundedBox args={[2.6, 0.1, 0.75]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#1b2b33" roughness={0.6} />
        </RoundedBox>
        {[-0.6, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.1, 0]} castShadow>
            <boxGeometry args={[0.55, 0.1, 0.5]} />
            <meshStandardMaterial color="#2f3742" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0.9, 0.09, 0]}>
          <boxGeometry args={[0.4, 0.08, 0.5]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-1.25, 0, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.4]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </Spin>
  );
}

export function PsuModel({ accent = "#8a6a2f" }: { accent?: string }) {
  return (
    <Spin speed={0.25}>
      <group>
        <RoundedBox args={[2.2, 1.2, 1.5]} radius={0.05} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#191d23" metalness={0.5} roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.02, 32]} />
          <meshStandardMaterial color="#0f1216" />
        </mesh>
        <group position={[0, 0.63, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <FanBlades accent={accent} />
        </group>
        {[-0.35, 0, 0.35].map((y) => (
          <mesh key={y} position={[-1.11, y, 0]}>
            <boxGeometry args={[0.02, 0.18, 0.9]} />
            <meshStandardMaterial color="#39404b" />
          </mesh>
        ))}
      </group>
    </Spin>
  );
}

export function CoolerModel({ accent = "#2f6fe8" }: { accent?: string }) {
  return (
    <Spin speed={0.25}>
      <group>
        {Array.from({ length: 22 }).map((_, i) => (
          <mesh key={i} position={[0, -0.7 + i * 0.07, 0]} castShadow>
            <boxGeometry args={[1.3, 0.02, 1.1]} />
            <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, -0.9, 0]} castShadow>
          <boxGeometry args={[0.9, 0.2, 0.9]} />
          <meshStandardMaterial color="#4a515c" metalness={0.8} roughness={0.3} />
        </mesh>
        <group position={[0, 0.1, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
            <meshStandardMaterial color="#15181e" roughness={0.5} />
          </mesh>
          <FanBlades accent={accent} />
        </group>
      </group>
    </Spin>
  );
}

// Scale/rotation for the downloaded peripheral models now live in the
// database (see supabase/schema-model-manager.sql and
// src/hooks/use-model-overrides.ts) — tunable from the admin Models page
// instead of hardcoded here. MODEL_OVERRIDE_DEFAULTS is what every one of
// these renders with until an admin saves a change.

export function MonitorModel({ accent = "#2f6fe8" }: { accent?: string }) {
  void accent; // The downloaded model brings its own materials/colors.
  const override = useModelOverride("monitor");
  return (
    <Spin speed={0.2}>
      <GltfModel
        url={override.modelUrl ?? MODEL_DEFAULT_FILES.monitor}
        scale={override.scale}
        rotation={override.rotation}
      />
    </Spin>
  );
}

export function KeyboardModel({ accent = "#c9a227" }: { accent?: string }) {
  void accent;
  const override = useModelOverride("keyboard");
  return (
    <Spin speed={0.3}>
      <GltfModel
        url={override.modelUrl ?? MODEL_DEFAULT_FILES.keyboard}
        scale={override.scale}
        rotation={override.rotation}
      />
    </Spin>
  );
}

// A real mouse silhouette reads by its outline: narrower at the front,
// widest at the palm, with a visible seam splitting the two click
// buttons and a small round scroll wheel between them. A single
// heavily-rounded box has none of those cues and just reads as a blob.
export function MouseModel({ accent = "#4a9e2f" }: { accent?: string }) {
  void accent;
  const override = useModelOverride("mouse");
  return (
    <Spin speed={0.35}>
      <GltfModel
        url={override.modelUrl ?? MODEL_DEFAULT_FILES.mouse}
        scale={override.scale}
        rotation={override.rotation}
      />
    </Spin>
  );
}

export function CaseModel({ accent = "#2f6fe8" }: { accent?: string }) {
  return (
    <Spin speed={0.22} bob={false}>
      <BuildModel build={null} accent={accent} scale={1} showcase />
    </Spin>
  );
}

function Panel({
  args,
  position,
  color = "#22262e",
  opacity = 1,
  transparent = false,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color?: string;
  opacity?: number;
  transparent?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        opacity={opacity}
        transparent={transparent}
        metalness={0.4}
        roughness={0.5}
      />
    </mesh>
  );
}

// Canonical drop-slot positions — shared by the visual placement above and
// the drag-and-drop raycaster, so a dropped part lands exactly where its
// installed counterpart would render. Monitor/keyboard/mouse sit outside
// the chassis, off to the right, like they're resting on a desk beside it.
export const SLOT_POSITIONS: Record<CategoryId, [number, number, number]> = {
  motherboard: [-0.35, 0.25, -0.6],
  cpu: [-0.28, 0.85, -0.35],
  cooler: [0.28, 0.85, -0.35],
  ram: [-0.28, 0.85, 0.33],
  gpu: [0.15, -0.15, -0.15],
  storage: [-0.24, 0.05, 0.55],
  psu: [0, -1.2, -0.1],
  case: [0, 0, 0],
  // Y values below are chosen so each object's actual lowest geometry
  // (foot/base/stand — not its group origin) lands on the same ground
  // plane as the case's feet (case foot bottom ≈ -1.74 in this shared
  // local space). Computed from each model's real mesh bounds, not
  // assumed — see the per-object comments in BuildModel below.
  // Y is now the same for all three: with GltfModel's recenter behavior,
  // every model's lowest point sits at local Y=0 regardless of scale —
  // so this value alone is the ground line, matching the case's own feet
  // (-1.74). No more per-model offset math needed when you swap files.
  monitor: [3.9, -1.60, -1.55],
  keyboard: [3.3, -1.60, 0.75],
  mouse: [5.5, -1.60, 0.9],
};

const SLOT_SIZE: Record<CategoryId, [number, number, number]> = {
  motherboard: [0.5, 1.2, 1.4],
  cpu: [0.4, 0.5, 0.5],
  cooler: [0.4, 1.0, 0.9],
  ram: [0.4, 0.9, 0.5],
  gpu: [1.3, 0.5, 1.9],
  storage: [0.4, 0.3, 0.75],
  psu: [1.95, 0.75, 2.0],
  case: [2.1, 3.2, 2.4],
  monitor: [3.0, 1.9, 0.8],
  keyboard: [3.2, 0.3, 1.2],
  mouse: [0.95, 0.55, 1.35],
};

export interface BuildModelProps {
  build: BuildState | null;
  accent?: string;
  scale?: number;
  showcase?: boolean;
  highlight?: CategoryId | null;
  hoverSlot?: CategoryId | null;
  hoverValid?: boolean;
  /** Category currently being dragged from the parts list, if any. Its
   * matching slot gets a soft green preview immediately — before the
   * cursor has actually reached it — so the user knows where it's headed
   * as soon as the camera zooms in. */
  previewCategory?: CategoryId | null;
}

function SlotHitbox({
  category,
  hovered,
  valid,
  previewing,
}: {
  category: CategoryId;
  hovered: boolean;
  valid: boolean;
  previewing: boolean;
}) {
  // Precisely hovering the right slot (cursor is actually over it, about
  // to drop) gets the strongest green. Hovering the wrong slot gets red.
  // Just "this is where the dragged part goes" (previewing, cursor not
  // there yet) gets a softer green — visible the instant the drag starts.
  const showGreen = (hovered && valid) || (!hovered && previewing);
  const showRed = hovered && !valid;
  const color = showGreen ? "#3fbf6f" : showRed ? "#e0473f" : "#2f6fe8";
  const visible = hovered || previewing;
  const fillOpacity = hovered ? 0.28 : previewing ? 0.16 : 0;

  return (
    <mesh
      name={`slot-${category}`}
      userData={{ slotCategory: category }}
      position={SLOT_POSITIONS[category]}
    >
      <boxGeometry args={SLOT_SIZE[category]} />
      <meshBasicMaterial color={color} transparent opacity={fillOpacity} depthWrite={false} />
      {visible && (
        <lineSegments>
          <edgesGeometry args={[new BoxGeometry(...SLOT_SIZE[category])]} />
          <lineBasicMaterial color={color} />
        </lineSegments>
      )}
    </mesh>
  );
}

/** A stylised open-side PC case that fills in as parts are selected. */
export function BuildModel({
  build,
  accent = "#2f6fe8",
  scale = 1,
  showcase = false,
  highlight = null,
  hoverSlot = null,
  hoverValid = false,
  previewCategory = null,
}: BuildModelProps) {
  const glow = useRef<Mesh>(null);
  const monitorOverride = useModelOverride("monitor");
  const keyboardOverride = useModelOverride("keyboard");
  const mouseOverride = useModelOverride("mouse");
  useFrame((state) => {
    if (glow.current) {
      const m = glow.current.material as { emissiveIntensity?: number };
      if (m.emissiveIntensity !== undefined) {
        m.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 1.6) * 0.18;
      }
    }
  });

  const has = (c: CategoryId) => showcase || Boolean(build?.[c]);
  // Peripherals sit outside the chassis on a desk — never shown in the
  // small "showcase" case-preview thumbnail, only in the real build view.
  const hasPeripheral = (c: CategoryId) => !showcase && Boolean(build?.[c]);
  const dim = (c: CategoryId) => (highlight && highlight !== c ? 0.35 : 1);
  const isDim = (c: CategoryId) => dim(c) < 1;
  const W = 2.1;
  const H = 3.2;
  const D = 2.4;

  return (
    <group scale={scale} position={[0, -0.2, 0]}>
      {/* --- Chassis shell: matte steel frame, open glass side --- */}
      <Panel args={[W, H, 0.06]} position={[0, 0, -D / 2]} color="#2b3038" />
      <Panel args={[0.06, H, D]} position={[-W / 2, 0, 0]} color="#31363f" />
      <Panel args={[W, 0.07, D]} position={[0, -H / 2, 0]} color="#23272e" />
      <Panel args={[W, 0.07, D]} position={[0, H / 2, 0]} color="#23272e" />
      {/* Open front perimeter keeps the internal components visible. */}
      {[
        {
          position: [0, H / 2 - 0.06, D / 2 - 0.04] as [number, number, number],
          args: [W, 0.1, 0.06] as [number, number, number],
        },
        {
          position: [0, -H / 2 + 0.06, D / 2 - 0.04] as [number, number, number],
          args: [W, 0.1, 0.06] as [number, number, number],
        },
        {
          position: [-W / 2 + 0.05, 0, D / 2 - 0.04] as [number, number, number],
          args: [0.1, H, 0.06] as [number, number, number],
        },
        {
          position: [W / 2 - 0.05, 0, D / 2 - 0.04] as [number, number, number],
          args: [0.1, H, 0.06] as [number, number, number],
        },
      ].map((bar, index) => (
        <mesh key={`front-frame-${index}`} position={bar.position} castShadow receiveShadow>
          <boxGeometry args={bar.args} />
          <meshStandardMaterial color="#303741" metalness={0.65} roughness={0.48} />
        </mesh>
      ))}

      {/* Clear tempered glass in front of the CPU and motherboard. */}
      <mesh position={[0, 0, D / 2 + 0.012]} renderOrder={2}>
        <boxGeometry args={[W - 0.18, H - 0.18, 0.025]} />
        <meshPhysicalMaterial
          color="#b9d7f2"
          transparent
          opacity={0.13}
          transmission={0.42}
          roughness={0.08}
          metalness={0.04}
          depthWrite={false}
        />
      </mesh>

      {(
        [
          [-W / 2 + 0.16, H / 2 - 0.16],
          [W / 2 - 0.16, H / 2 - 0.16],
          [-W / 2 + 0.16, -H / 2 + 0.16],
          [W / 2 - 0.16, -H / 2 + 0.16],
        ] as Array<[number, number]>
      ).map(([x, y], index) => (
        <mesh key={`glass-screw-${index}`} position={[x, y, D / 2 + 0.035]}>
          <cylinderGeometry args={[0.035, 0.035, 0.018, 16]} />
          <meshStandardMaterial color="#91a7bd" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {/* Frame edges pick up light so the box reads as a chassis, not a slab */}
      {[
        [W / 2, 0, D / 2],
        [W / 2, 0, -D / 2],
        [-W / 2, 0, D / 2],
      ].map(([x, y, z]: number[]) => (
        <mesh key={`post-${x}-${z}`} position={[x!, y!, z!]}>
          <boxGeometry args={[0.06, H, 0.06]} />
          <meshStandardMaterial color="#3d434d" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      {/* Feet */}
      {[
        [-W / 2 + 0.2, D / 2 - 0.22],
        [-W / 2 + 0.2, -D / 2 + 0.22],
        [W / 2 - 0.2, D / 2 - 0.22],
        [W / 2 - 0.2, -D / 2 + 0.22],
      ].map(([x, z]: number[]) => (
        <mesh key={`foot-${x}-${z}`} position={[x!, -H / 2 - 0.08, z!]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.12, 16]} />
          <meshStandardMaterial color="#15181d" roughness={0.8} />
        </mesh>
      ))}
      {/* Front IO strip */}
      <mesh position={[0, H / 2 - 0.06, D / 2 + 0.02]}>
        <boxGeometry args={[0.6, 0.05, 0.02]} />
        <meshStandardMaterial color="#0e1116" roughness={0.7} />
      </mesh>
      <mesh position={[0.24, H / 2 - 0.06, D / 2 + 0.03]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      {/* Rear IO shield + PCI slot covers */}
      <mesh position={[-0.35, 1.05, -D / 2 - 0.04]}>
        <boxGeometry args={[1.1, 0.42, 0.02]} />
        <meshStandardMaterial color="#7d838d" metalness={0.9} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`pci-${i}`} position={[-0.1, 0.15 - i * 0.22, -D / 2 - 0.04]}>
          <boxGeometry args={[1.5, 0.16, 0.02]} />
          <meshStandardMaterial color="#3d434d" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Glass side panel */}

      <mesh position={[W / 2, 0, 0]}>
        <boxGeometry args={[0.02, H - 0.12, D - 0.12]} />
        <meshPhysicalMaterial
          color="#9fb4d4"
          transparent
          opacity={0.07}
          roughness={0.02}
          metalness={0}
        />
      </mesh>

      {/* Motherboard tray + board */}
      {has("motherboard") && (
        <group name="part-motherboard" userData={{ partCategory: "motherboard" }}>
          <mesh position={[-0.4, 0.35, -0.15]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[1.9, 2.0, 0.05]} />
            <meshStandardMaterial
              color={PCB}
              roughness={0.65}
              transparent={isDim("motherboard")}
              opacity={dim("motherboard")}
            />
          </mesh>
          {/* Chipset + VRM heatsinks */}
          <mesh position={[-0.3, -0.25, 0.35]} castShadow>
            <boxGeometry args={[0.14, 0.4, 0.4]} />
            <meshStandardMaterial color="#454b56" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[-0.3, 1.15, -0.35]} castShadow>
            <boxGeometry args={[0.14, 0.35, 0.75]} />
            <meshStandardMaterial color="#3a4049" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Board RGB trace */}
          <mesh position={[-0.34, 0.35, 0.72]}>
            <boxGeometry args={[0.02, 1.7, 0.03]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} />
          </mesh>
        </group>
      )}

      {/* CPU (IHS peeking out under the cooler) */}
      {has("cpu") && (
        <group
          position={[-0.3, 0.7, -0.15]}
          name="part-cpu"
          userData={{ partCategory: "cpu" }}
        >
          {/* Dark CPU socket */}
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.5, 0.5]} />
            <meshStandardMaterial
              color="#11151c"
              metalness={0.25}
              roughness={0.72}
              transparent={isDim("cpu")}
              opacity={dim("cpu")}
            />
          </mesh>

          {/* Metal CPU heat spreader */}
          <mesh position={[0.035, 0, 0]} castShadow>
            <boxGeometry args={[0.075, 0.37, 0.37]} />
            <meshStandardMaterial
              color="#bec5d0"
              metalness={0.9}
              roughness={0.2}
              transparent={isDim("cpu")}
              opacity={dim("cpu")}
            />
          </mesh>

          {/* CPU retention frame */}
          <mesh position={[0.08, 0.09, 0]} castShadow>
            <boxGeometry args={[0.018, 0.06, 0.18]} />
            <meshStandardMaterial
              color="#777f8c"
              metalness={0.85}
              roughness={0.28}
              transparent={isDim("cpu")}
              opacity={dim("cpu")}
            />
          </mesh>

          {/* Orange socket/latch accents */}
          {[-0.2, 0.2].map((z) => (
            <mesh key={`cpu-latch-${z}`} position={[0.09, 0, z]}>
              <boxGeometry args={[0.02, 0.05, 0.12]} />
              <meshStandardMaterial
                color="#ff6b22"
                emissive="#ff6b22"
                emissiveIntensity={0.45}
                transparent={isDim("cpu")}
                opacity={dim("cpu")}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Tower cooler: fin stack + fan + top plate */}
      {has("cooler") && (
        <group
          position={[0, 0.72, -0.15]}
          name="part-cooler"
          userData={{ partCategory: "cooler" }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <mesh key={i} position={[-0.16 + i * 0.028, 0, 0]} castShadow>
              <boxGeometry args={[0.012, 0.9, 0.78]} />
              <meshStandardMaterial
                color="#b9c0cc"
                metalness={0.9}
                roughness={0.22}
                transparent={isDim("cooler")}
                opacity={dim("cooler")}
              />
            </mesh>
          ))}
          <mesh position={[-0.02, 0.5, 0]} castShadow>
            <boxGeometry args={[0.42, 0.06, 0.8]} />
            <meshStandardMaterial color="#2b3038" metalness={0.7} roughness={0.35} />
          </mesh>
          <group position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* Square fan frame with a hollow centre reads far better than a
                solid disc, which looked like a black ball inside the case. */}
            {[
              [0, 0, 0.3],
              [0, 0, -0.3],
            ].map(([x, y, z]: number[]) => (
              <mesh key={`fz-${z}`} position={[x!, y!, z!]}>
                <boxGeometry args={[0.62, 0.06, 0.06]} />
                <meshStandardMaterial color="#2b313a" roughness={0.6} />
              </mesh>
            ))}
            {[-0.3, 0.3].map((x) => (
              <mesh key={`fx-${x}`} position={[x, 0, 0]}>
                <boxGeometry args={[0.06, 0.06, 0.62]} />
                <meshStandardMaterial color="#2b313a" roughness={0.6} />
              </mesh>
            ))}
            <FanBlades accent={accent} />
          </group>
        </group>
      )}

      {/* RAM sticks in their DIMM slots */}
      {has("ram") &&
        [0, 1].map((i) => (
          <group
            key={i}
            position={[-0.3, 0.72, 0.42 + i * 0.14]}
            name="part-ram"
            userData={{ partCategory: "ram" }}
          >
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.72, 0.07]} />
              <meshStandardMaterial
                color="#2a2f38"
                metalness={0.6}
                roughness={0.35}
                transparent={isDim("ram")}
                opacity={dim("ram")}
              />
            </mesh>
            <mesh position={[0, 0.38, 0]}>
              <boxGeometry args={[0.09, 0.05, 0.06]} />
              <meshStandardMaterial color="#7c5cf0" emissive="#7c5cf0" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}

      {/* GPU: backplate, shroud, twin fans, sag bracket */}
      {has("gpu") && (
        <group
          position={[0.02, -0.1, -0.05]}
          name="part-gpu"
          userData={{ partCategory: "gpu" }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.3, 1.75]} />
            <meshStandardMaterial
              color="#252a33"
              metalness={0.65}
              roughness={0.35}
              transparent={isDim("gpu")}
              opacity={dim("gpu")}
            />
          </mesh>
          {[-0.42, 0.42].map((z) => (
            <group key={z} position={[0.1, 0.16, z]}>
              <mesh>
                <cylinderGeometry args={[0.3, 0.3, 0.04, 26]} />
                <meshStandardMaterial color="#14181e" roughness={0.55} />
              </mesh>
              <FanBlades accent="#5d6470" />
            </group>
          ))}
          <mesh ref={glow} position={[0, 0, 0.9]}>
            <boxGeometry args={[0.7, 0.06, 0.02]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[-0.45, 0.2, 0]}>
            <boxGeometry args={[0.04, 0.12, 1.6]} />
            <meshStandardMaterial color="#8f959f" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* Storage: M.2 drive on the board */}
      {has("storage") && (
        <group
          position={[-0.3, -0.6, 0.15]}
          name="part-storage"
          userData={{ partCategory: "storage" }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.16, 0.7]} />
            <meshStandardMaterial
              color="#39414c"
              metalness={0.7}
              roughness={0.35}
              transparent={isDim("storage")}
              opacity={dim("storage")}
            />
          </mesh>
          <mesh position={[0.045, 0, 0]}>
            <boxGeometry args={[0.01, 0.08, 0.5]} />
            <meshStandardMaterial color="#2bb0c4" emissive="#2bb0c4" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* PSU shroud + unit */}
      {has("psu") && (
        <group name="part-psu" userData={{ partCategory: "psu" }}>
          <mesh position={[0, -1.22, -0.05]} castShadow receiveShadow>
            <boxGeometry args={[W - 0.18, 0.62, D - 0.3]} />
            <meshStandardMaterial
              color="#272c34"
              metalness={0.5}
              roughness={0.5}
              transparent={isDim("psu")}
              opacity={dim("psu")}
            />
          </mesh>
          <mesh position={[0.2, -1.22, D / 2 - 0.18]}>
            <boxGeometry args={[0.9, 0.05, 0.02]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} />
          </mesh>
          {/* Cable pass-through grommets on the tray */}
          {[-0.55, 0.05].map((z) => (
            <mesh key={z} position={[-0.36, -0.82, z]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.1, 0.04, 0.42]} />
              <meshStandardMaterial color="#12151a" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Front intake fans, mounted just behind the mesh bezel */}
      {[0.95, 0.2, -0.55].map((y) => (
        <group key={y} position={[0, y, D / 2 - 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.33, 0.33, 0.06, 26]} />
            <meshStandardMaterial color="#191d23" roughness={0.6} />
          </mesh>
          <FanBlades accent={accent} />
        </group>
      ))}
      {/* Rear exhaust fan */}
      <group position={[-0.1, 1.0, -D / 2 + 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.06, 24]} />
          <meshStandardMaterial color="#191d23" roughness={0.6} />
        </mesh>
        <FanBlades accent="#5d6470" />
      </group>
      {/* Soft interior fill so the internals read through the glass */}
      <pointLight position={[0.75, 0.7, 0.5]} intensity={3.6} distance={5} color="#dbe6ff" />
      <pointLight position={[0.3, -0.9, -0.4]} intensity={1.4} distance={3.5} color={accent} />

      {/* Monitor, keyboard and mouse — resting beside the case, not inside
          it. Static (no Spin/bob) since they're part of the desk scene, not
          a standalone part preview. */}
      {hasPeripheral("monitor") && (
        <group
          position={SLOT_POSITIONS.monitor}
          rotation={monitorOverride.rotation}
          scale={monitorOverride.scale}
          name="part-monitor"
          userData={{ partCategory: "monitor" }}
        >
          <GltfModel url={monitorOverride.modelUrl ?? MODEL_DEFAULT_FILES.monitor} />
        </group>
      )}

      {hasPeripheral("keyboard") && (
        <group
          position={SLOT_POSITIONS.keyboard}
          rotation={keyboardOverride.rotation}
          scale={keyboardOverride.scale}
          name="part-keyboard"
          userData={{ partCategory: "keyboard" }}
        >
          <GltfModel url={keyboardOverride.modelUrl ?? MODEL_DEFAULT_FILES.keyboard} />
        </group>
      )}

      {hasPeripheral("mouse") && (
        <group
          position={SLOT_POSITIONS.mouse}
          rotation={mouseOverride.rotation}
          scale={mouseOverride.scale}
          name="part-mouse"
          userData={{ partCategory: "mouse" }}
        >
          <GltfModel url={mouseOverride.modelUrl ?? MODEL_DEFAULT_FILES.mouse} />
        </group>
      )}

      {/* Invisible drop targets for drag-and-drop; lit up on hover, and
          the dragged category's own slot gets a soft preview even before
          the cursor reaches it. */}
      {!showcase &&
        DROPPABLE_SLOTS.map((category) => (
          <SlotHitbox
            key={category}
            category={category}
            hovered={hoverSlot === category}
            valid={hoverValid}
            previewing={previewCategory === category}
          />
        ))}
    </group>
  );
}

export function PartModel({ category, accent }: { category: CategoryId; accent?: string }) {
  const a = accent ?? "#2f6fe8";
  switch (category) {
    case "cpu":
      return <CpuModel accent={a} />;
    case "gpu":
      return <GpuModel accent={a} />;
    case "motherboard":
      return <MotherboardModel accent={a} />;
    case "ram":
      return <RamModel accent={a} />;
    case "storage":
      return <StorageModel accent={a} />;
    case "psu":
      return <PsuModel accent={a} />;
    case "cooler":
      return <CoolerModel accent={a} />;
    case "case":
      return <CaseModel accent={a} />;
    case "monitor":
      return <MonitorModel accent={a} />;
    case "keyboard":
      return <KeyboardModel accent={a} />;
    case "mouse":
      return <MouseModel accent={a} />;
  }
}