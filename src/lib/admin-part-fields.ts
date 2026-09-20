import type { CategoryId } from "@/data/types";

export type FieldType = "text" | "number" | "boolean" | "csv" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  /** For type "select" */
  options?: string[];
  /** For type "number" */
  step?: number;
}

// Fields beyond the common BasePart ones (id, brand, name, price, rating,
// reviews, performance, popularity, power, highlight, accent — those get a
// fixed form of their own). "csv" fields are comma-separated text that
// becomes a string[] on save (e.g. cooler sockets, case supportedFormFactors).
export const CATEGORY_FIELDS: Record<CategoryId, FieldConfig[]> = {
  cpu: [
    { key: "socket", label: "Socket", type: "text" },
    { key: "cores", label: "Cores", type: "number" },
    { key: "threads", label: "Threads", type: "number" },
    { key: "baseClock", label: "Base clock (GHz)", type: "number", step: 0.1 },
    { key: "boostClock", label: "Boost clock (GHz)", type: "number", step: 0.1 },
    { key: "architecture", label: "Architecture", type: "text" },
    { key: "integratedGraphics", label: "Integrated graphics", type: "boolean" },
  ],
  gpu: [
    { key: "chipset", label: "Chipset", type: "text" },
    { key: "vram", label: "VRAM (GB)", type: "number" },
    { key: "memoryType", label: "Memory type", type: "text" },
    { key: "length", label: "Length (mm)", type: "number" },
    { key: "interface", label: "Interface", type: "text" },
    { key: "architecture", label: "Architecture", type: "text" },
    { key: "recommendedPsu", label: "Recommended PSU (W)", type: "number" },
  ],
  motherboard: [
    { key: "socket", label: "Socket", type: "text" },
    { key: "chipset", label: "Chipset", type: "text" },
    {
      key: "formFactor",
      label: "Form factor",
      type: "select",
      options: ["ATX", "Micro ATX", "Mini ITX"],
    },
    { key: "memoryType", label: "Memory type", type: "select", options: ["DDR4", "DDR5"] },
    { key: "memorySlots", label: "Memory slots", type: "number" },
    { key: "maxMemory", label: "Max memory (GB)", type: "number" },
    { key: "wifi", label: "Wi-Fi", type: "boolean" },
  ],
  ram: [
    { key: "memoryType", label: "Memory type", type: "select", options: ["DDR4", "DDR5"] },
    { key: "capacity", label: "Capacity (GB)", type: "number" },
    { key: "speed", label: "Speed (MT/s)", type: "number" },
    { key: "modules", label: "Modules (e.g. 2x16GB)", type: "text" },
    { key: "casLatency", label: "CAS latency", type: "number" },
    { key: "rgb", label: "RGB", type: "boolean" },
  ],
  storage: [
    { key: "interface", label: "Interface", type: "text" },
    { key: "driveType", label: "Drive type", type: "select", options: ["SSD", "HDD"] },
    { key: "capacity", label: "Capacity (GB)", type: "number" },
    { key: "readSpeed", label: "Read speed (MB/s)", type: "number" },
    { key: "formFactor", label: "Form factor", type: "text" },
  ],
  psu: [
    { key: "wattage", label: "Wattage", type: "number" },
    { key: "efficiency", label: "Efficiency rating", type: "text" },
    { key: "modular", label: "Modular", type: "text" },
    { key: "formFactor", label: "Form factor", type: "text" },
  ],
  case: [
    {
      key: "supportedFormFactors",
      label: "Supported form factors (comma-separated)",
      type: "csv",
    },
    { key: "formFactor", label: "Case form factor", type: "text" },
    { key: "maxGpuLength", label: "Max GPU length (mm)", type: "number" },
    { key: "maxCoolerHeight", label: "Max cooler height (mm)", type: "number" },
    { key: "radiatorSupport", label: "Radiator support", type: "text" },
    { key: "temperedGlass", label: "Tempered glass", type: "boolean" },
  ],
  cooler: [
    { key: "coolerType", label: "Cooler type", type: "select", options: ["Air", "Liquid"] },
    { key: "sockets", label: "Supported sockets (comma-separated)", type: "csv" },
    { key: "height", label: "Height (mm)", type: "number" },
    { key: "tdpRating", label: "TDP rating (W)", type: "number" },
    { key: "radiator", label: "Radiator size", type: "text" },
  ],
  monitor: [
    { key: "size", label: "Size (inches)", type: "number", step: 0.1 },
    { key: "resolution", label: "Resolution", type: "text" },
    { key: "refreshRate", label: "Refresh rate (Hz)", type: "number" },
    { key: "panelType", label: "Panel type", type: "text" },
    { key: "responseTime", label: "Response time (ms)", type: "number", step: 0.1 },
  ],
  mouse: [
    { key: "connection", label: "Connection", type: "select", options: ["Wired", "Wireless"] },
    { key: "sensor", label: "Sensor", type: "text" },
    { key: "dpi", label: "DPI", type: "number" },
    { key: "buttons", label: "Buttons", type: "number" },
    { key: "weight", label: "Weight (g)", type: "number" },
  ],
  keyboard: [
    { key: "connection", label: "Connection", type: "select", options: ["Wired", "Wireless"] },
    { key: "switchType", label: "Switch type", type: "text" },
    { key: "layout", label: "Layout", type: "text" },
    { key: "hotswap", label: "Hot-swappable", type: "boolean" },
  ],
};
