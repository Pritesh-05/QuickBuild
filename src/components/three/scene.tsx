import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Instance,
  Instances,
  OrbitControls,
  PerspectiveCamera,
  Environment,
  MeshReflectorMaterial,
  Sparkles,
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CategoryId } from "@/data/types";
import { DragDropController } from "./drag-drop-controller";
import { CameraRig } from "./camera-rig";
import { BuildModel, PartModel } from "./models";
import { PartHoverController } from "./part-hover-controller";
import { ComponentHoverHud } from "./component-hover-hud";
import type { ViewerProps } from "./viewer";
import { useTouchDrag } from "@/lib/touch-drag";

function GamerRoom() {
  return (
    <group>
      <Environment preset="city" />

      {/* Desk - Top surface perfectly aligned at -1.795 to match PC feet */}
      <mesh position={[2, -1.795, -1]} receiveShadow>
        <boxGeometry args={[45, 0.1, 20]} />
        {/* Reflector cost scales hard with resolution and blur kernel size —
            this is the single most expensive material in the room. Halving
            resolution and cutting the blur radius keeps the reflective desk
            look while costing a fraction of the frame time. */}
        <MeshReflectorMaterial
          blur={[200, 50]}
          resolution={512}
          mixBlur={1}
          mixStrength={80}
          roughness={0.15}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.8}
          mirror={1}
        />
      </mesh>

      {/* Glowing Desk Mat - Lowered to -1.78 so it perfectly underlays components */}
      <group position={[3, -1.78, -0.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 6]} />
          <meshStandardMaterial color="#080808" roughness={1} />
        </mesh>
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16.1, 6.1]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
      </group>

      {/* Desk Accessories */}
      <group position={[-1.5, -1.74, 1]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.45, 32]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.2, 0.25, 0]} castShadow>
          <torusGeometry args={[0.12, 0.03, 16, 32]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      <group position={[-2.8, -1.73, -0.5]} rotation={[-Math.PI / 2, 0, -0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 1.6, 0.04]} />
          <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[0.75, 1.55]} />
          <meshBasicMaterial color="#00d8ff" transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Back Slat Wall (Pushed back to fix clipping) */}
      <group position={[0, 0, -12]}>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[100, 40, 0.5]} />
          <meshStandardMaterial color="#020202" roughness={1} />
        </mesh>
        {/* Was 80 separate meshes, each its own draw call and each a shadow
            caster — the shadow pass alone had to process all 80 every
            frame for a background wall you barely look at. Instancing
            collapses them into a single draw call; shadows come only from
            the wall block behind, which reads the same from a distance. */}
        <Instances limit={80} range={80}>
          <boxGeometry args={[0.4, 40, 0.5]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.5} metalness={0.5} />
          {Array.from({ length: 80 }).map((_, i) => (
            <Instance key={i} position={[-39.5 + i, 12, 0.4]} />
          ))}
        </Instances>
      </group>

      {/* Center Neon Rings */}
      <mesh position={[2, 6, -11]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[4.5, 0.08, 16, 6]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={5} />
        <pointLight color="#ff0055" intensity={100} distance={20} />
      </mesh>
      <mesh position={[2, 6, -11.2]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[5, 0.04, 16, 6]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3} />
      </mesh>

      {/* Left Side Wall */}
      <mesh position={[-20, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[100, 30, 0.5]} />
        <meshStandardMaterial color="#040406" roughness={0.9} />
      </mesh>
      
      {/* Left Wall: Custom EXIT Neon Sign */}
      <group position={[-19.7, 5, -2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[10, 4, 0.1]} />
          <meshStandardMaterial color="#020202" roughness={0.8} />
        </mesh>
        <group position={[0.5, 0.5, 0.1]}>
          {/* E */}
          <mesh position={[-3, 0, 0]}><boxGeometry args={[0.2, 1.5, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          <mesh position={[-2.6, 0.65, 0]}><boxGeometry args={[0.8, 0.2, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          <mesh position={[-2.6, 0, 0]}><boxGeometry args={[0.8, 0.2, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          <mesh position={[-2.6, -0.65, 0]}><boxGeometry args={[0.8, 0.2, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          {/* X */}
          <mesh position={[-1, 0, 0]} rotation={[0,0,0.5]}><boxGeometry args={[0.2, 1.8, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          <mesh position={[-1, 0, 0]} rotation={[0,0,-0.5]}><boxGeometry args={[0.2, 1.8, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          {/* I */}
          <mesh position={[0.2, 0, 0]}><boxGeometry args={[0.2, 1.5, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          {/* T */}
          <mesh position={[1.5, 0.65, 0]}><boxGeometry args={[1.2, 0.2, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
          <mesh position={[1.5, 0, 0]}><boxGeometry args={[0.2, 1.5, 0.1]}/><meshBasicMaterial color="#ff0055" /></mesh>
        </group>
        {/* Cyan Box underneath */}
        <mesh position={[-0.2, -1.2, 0.1]}>
          <boxGeometry args={[4.5, 0.8, 0.1]} />
          {/* meshBasicMaterial is already unlit and fully bright on its own —
              the pointLight that used to sit here was mostly redundant with
              it and with the pink light just below, so it's dropped rather
              than tuned down. */}
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <mesh position={[-0.2, -1.2, 0.12]}>
          <boxGeometry args={[4.3, 0.6, 0.1]} />
          <meshBasicMaterial color="#020202" />
        </mesh>
        <pointLight color="#ff0055" intensity={80} distance={20} />
      </group>

      {/* Right Side Wall */}
      <mesh position={[20, 10, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[100, 30, 0.5]} />
        <meshStandardMaterial color="#040406" roughness={0.9} />
      </mesh>

      {/* Right Wall: Floating Shelves */}
      <group position={[19.6, 6, -2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[8, 0.15, 1.2]} />
          <meshStandardMaterial color="#1a1512" roughness={0.8} />
        </mesh>
        <mesh castShadow receiveShadow position={[-2, -1.5, 0]}>
          <boxGeometry args={[5, 0.15, 1.2]} />
          <meshStandardMaterial color="#1a1512" roughness={0.8} />
        </mesh>
        <pointLight position={[0, 1.3, 0.5]} color="#ff5e00" intensity={20} distance={10} />
        <pointLight position={[-2, -1.7, 0.5]} color="#00e5ff" intensity={20} distance={10} />
      </group>

      {/* Particle counts halved — 250 animated sparkles was overkill for
          ambient dust motes and added up with everything else in the room. */}
      <Sparkles count={70} scale={25} size={1.5} speed={0.4} opacity={0.3} color="#00e5ff" />
      <Sparkles count={50} scale={25} size={2.5} speed={0.2} opacity={0.2} color="#ff0055" />

      {/* ---------------------------------------------------------
          FIX: STUDIO LIGHTING WITH A DEDICATED DESK LAMP
          --------------------------------------------------------- */}
      <ambientLight intensity={0.2} />
      <spotLight position={[2, 20, 8]} intensity={100} angle={0.8} penumbra={1} color="#ffffff" castShadow />
      <pointLight position={[6, 2, 5]} intensity={60} color="#00e5ff" distance={20} />
      <pointLight position={[-6, 6, -2]} intensity={80} color="#b300ff" distance={25} />
      
      {/* NEW: Dedicated white desk light directly over the keyboard & mouse so they aren't completely shadowed */}
      <pointLight position={[4, 1, 1]} intensity={45} color="#ffffff" distance={8} />
    </group>
  );
}

export function Scene({
  mode,
  category = "cpu",
  build,
  accent = "#2f6fe8",
  highlight = null,
  autoRotate = false,
  enableZoom = true,
  freeView = false,
  onDropPart,
}: Omit<ViewerProps, "className">) {
  const isBuild = mode === "build";

  const [hoverSlot, setHoverSlot] = useState<CategoryId | null>(null);
  const [hoverValid, setHoverValid] = useState(false);
  const [nativePreviewCategory, setNativePreviewCategory] = useState<CategoryId | null>(null);
  const [hoverPart, setHoverPart] = useState<CategoryId | null>(null);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const touchDrag = useTouchDrag();

  useEffect(() => {
    if (!isBuild) return;

    function handleDragStart(event: DragEvent) {
      const marker = Array.from(event.dataTransfer?.types ?? []).find((type) =>
        type.startsWith("quickbuild/"),
      );
      if (marker) {
        setNativePreviewCategory(marker.split("/")[1] as CategoryId);
      }
    }

    function handleDragEnd() {
      setNativePreviewCategory(null);
    }

    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
    };
  }, [isBuild]);

  useEffect(() => {
    if (freeView && controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [freeView]);

  const effectiveHoverSlot = hoverSlot ?? touchDrag.hoverCategory;
  const effectiveHoverValid = hoverSlot !== null ? hoverValid : touchDrag.hoverValid;
  const effectivePreviewCategory = freeView 
    ? null 
    : (nativePreviewCategory ?? touchDrag.draggingPart?.category ?? null);

  return (
    <Canvas
      shadows
      // Free view carries a much heavier scene (reflective floor, room
      // geometry, a dozen lights) than the part/build views, so it renders
      // at a lower device-pixel-ratio cap — on a retina/high-DPI screen
      // dpr:2 was pushing 4x the fragment work of dpr:1 through all of that.
      dpr={freeView ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true }}
    >
      <color
        attach="background"
        args={[freeView ? "#030304" : "#16171c"]}
      />

      <PerspectiveCamera
        makeDefault
        position={freeView ? [4, 2.5, 14] : [7, 4.5, 10]}
        fov={38}
      />

      {!freeView && (
        <group>
          <ambientLight intensity={0.42} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#9fb6ff" />
          <directionalLight position={[0, -4, 2]} intensity={0.35} color="#ffffff" />
          <hemisphereLight args={["#cfd7ff", "#1a1b21", 0.6]} />
        </group>
      )}

      {freeView && <GamerRoom />}

      <group
        position={[
          0,
          isBuild ? 0 : -0.2,
          0,
        ]}
      >
        {isBuild ? (
          <BuildModel
            build={build ?? null}
            accent={accent}
            highlight={highlight}
            hoverSlot={effectiveHoverSlot}
            hoverValid={effectiveHoverValid}
            previewCategory={effectivePreviewCategory}
          />
        ) : (
          <PartModel
            category={category}
            accent={accent}
          />
        )}
      </group>

      {isBuild && onDropPart && !freeView && (
        <DragDropController
          onHoverChange={(slot, valid) => {
            setHoverSlot(slot);
            setHoverValid(valid);
          }}
          onDrop={(part, matched) => {
            onDropPart(part, matched);
          }}
        />
      )}

      {isBuild && !freeView && (
        <PartHoverController
          enabled={!effectivePreviewCategory}
          onHoverChange={setHoverPart}
        />
      )}

      {isBuild && !freeView && hoverPart && build?.[hoverPart] && (
        <ComponentHoverHud category={hoverPart} part={build[hoverPart]!} />
      )}

      {isBuild && (
        <CameraRig
          active={!freeView}
          controlsRef={controlsRef}
        />
      )}

      {!freeView && (
        <ContactShadows
          position={[0, isBuild ? -1.85 : -1.3, 0]}
          opacity={0.5}
          scale={12}
          blur={2.6}
          far={5}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={freeView}
        enableZoom={freeView ? true : enableZoom}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={5}
        maxDistance={freeView ? 35 : 15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={freeView ? Math.PI / 2 : Math.PI / 1.95}
        target={freeView ? [1.5, -0.2, 0] : [0.9, -0.2, 0]}
      />
    </Canvas>
  );
}