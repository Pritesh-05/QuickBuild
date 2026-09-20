import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Box3, Vector3, type Group, type Material, type Mesh } from "three";
import { SkeletonUtils } from "three-stdlib";

/**
 * Paths to the downloaded peripheral models, served from /public/models/.
 * Update these if you name your files differently. useGLTF.preload below
 * kicks off the download as soon as this module loads, instead of only
 * once the model is first rendered.
 */
export const MODEL_URLS = {
  monitor: "/models/monitor.glb",
  keyboard: "/models/keyboard.glb",
  mouse: "/models/mouse.glb",
} as const;

useGLTF.preload(MODEL_URLS.monitor);
useGLTF.preload(MODEL_URLS.keyboard);
useGLTF.preload(MODEL_URLS.mouse);

interface GltfModelProps {
  url: string;
  /** Uniform or per-axis scale. Downloaded models are almost never sized
   * to match this scene out of the box — expect to tune this by eye, or
   * from the native-size console log below. */
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Wired to the same dim()/highlight opacity used by the rest of the
   * scene during drag-focus and category highlighting. */
  opacity?: number;
  /** Re-centers the model so its footprint is centered in X/Z and its
   * lowest point sits at local Y=0 — regardless of where the original
   * file's author placed its pivot (rarely the center, unlike hand-built
   * geometry). This is what makes `position` behave predictably for an
   * arbitrary downloaded file. Default true; only disable it if a
   * specific file is already correctly centered and this makes it worse.
   */
  recenter?: boolean;
}

/**
 * Renders any downloaded glTF/GLB file, regardless of its internal node
 * names — uses <primitive> rather than referencing specific meshes, so it
 * works with whatever you drop into /public/models without per-model
 * code. Clones the loaded scene per instance (via SkeletonUtils.clone)
 * so the same file can safely be used in more than one place at once —
 * e.g. this build view and a parts-list preview card — without them
 * fighting over shared transforms.
 */
export function GltfModel({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
  recenter = true,
}: GltfModelProps) {
  const { scene } = useGLTF(url);

  const { cloned, innerOffset, rawSize, rawCenter } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Group;
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const offset: [number, number, number] = recenter
      ? [-center.x, -box.min.y, -center.z]
      : [0, 0, 0];
    return { cloned: clone, innerOffset: offset, rawSize: size, rawCenter: center };
    // scene/recenter fully determine the memoized values; url is only
    // used for the debug log in the other effect below.
  }, [scene, recenter]);

  useEffect(() => {
    // TEMPORARY DEBUG AID — safe to delete once monitor/keyboard/mouse are
    // all tuned. Logs the model's *native* size (its own file's units,
    // before our scale prop or recentering) so you can compute an exact
    // scale instead of guessing:
    //   scale needed ≈ targetSceneUnits / nativeSizeLoggedHere

    console.log(
      `[gltf-model] ${url} — native size (x,y,z): ${rawSize.x.toFixed(3)}, ${rawSize.y.toFixed(3)}, ${rawSize.z.toFixed(3)}  |  native center: ${rawCenter.x.toFixed(3)}, ${rawCenter.y.toFixed(3)}, ${rawCenter.z.toFixed(3)}`,
    );
  }, [url, rawSize, rawCenter]);

  useEffect(() => {
    cloned.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        const m = mat as Material & { opacity?: number; transparent?: boolean };
        if (!m) return;
        m.transparent = opacity < 1;
        m.opacity = opacity;
      });
    });
  }, [cloned, opacity]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} position={innerOffset} />
    </group>
  );
}