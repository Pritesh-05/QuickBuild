export type ModelKey = "monitor" | "keyboard" | "mouse" | "mascot";

export interface ModelOverride {
  /** Public URL of an admin-uploaded replacement file, or null to use the
   * app's built-in default file for this model. */
  modelUrl: string | null;
  scale: [number, number, number];
  /** Radians, same convention as everywhere else in the 3D scene. */
  rotation: [number, number, number];
}

/**
 * The exact numbers already hand-tuned for monitor/keyboard/mouse (see the
 * old PERIPHERAL_TRANSFORM comment history in models.tsx) plus the
 * mascot's existing scale. Used two ways:
 *  - server-side, as the fallback for any model an admin hasn't touched
 *    yet in the new Models admin page
 *  - client-side, as useModelOverrides()'s initialData, so nothing shifts
 *    visually for anyone until an admin actually saves a change there
 */
export const MODEL_OVERRIDE_DEFAULTS: Record<ModelKey, ModelOverride> = {
  monitor: { modelUrl: null, scale: [1, 1, 1], rotation: [0, 4.5, 0] },
  keyboard: { modelUrl: null, scale: [10, 10, 10], rotation: [0, -0.1, 0] },
  mouse: { modelUrl: null, scale: [30, 30, 30], rotation: [0, -0.3, 0] },
  mascot: { modelUrl: null, scale: [1.2, 1.2, 1.2], rotation: [0, 0, 0] },
};

export const MODEL_LABELS: Record<ModelKey, string> = {
  monitor: "Monitor",
  keyboard: "Keyboard",
  mouse: "Mouse",
  mascot: "Review mascot",
};

/** Built-in file served from /public/models, used whenever no admin
 * override URL has been saved for that model. */
export const MODEL_DEFAULT_FILES: Record<ModelKey, string> = {
  monitor: "/models/monitor.glb",
  keyboard: "/models/keyboard.glb",
  mouse: "/models/mouse.glb",
  mascot: "/models/mascot.glb",
};

export const MODEL_KEYS: ModelKey[] = ["monitor", "keyboard", "mouse", "mascot"];