import type { CategoryId, Part } from "@/data/types";
import { currency } from "@/lib/format";

export type SpecDirection = "higher" | "lower" | "none";

export interface SpecRow {
  key: string;
  label: string;
  /** Displayed value */
  format: (part: Part) => string;
  /** Numeric value used to highlight the best option, when comparable */
  value?: (part: Part) => number | null;
  better: SpecDirection;
}

const n = (v: number | null | undefined) => (typeof v === "number" ? v : null);

const priceRow: SpecRow = {
  key: "price",
  label: "Price",
  format: (p) => currency(p.price),
  value: (p) => p.price,
  better: "lower",
};

const performanceRow: SpecRow = {
  key: "performance",
  label: "Performance",
  format: (p) => `${p.performance} / 100`,
  value: (p) => p.performance,
  better: "higher",
};

const ratingRow: SpecRow = {
  key: "rating",
  label: "Rating",
  format: (p) => `${p.rating.toFixed(1)} ★`,
  value: (p) => p.rating,
  better: "higher",
};

const valueRow: SpecRow = {
  key: "value",
  label: "Value (perf / ₹10,000)",
  format: (p) => ((p.performance / p.price) * 10000).toFixed(1),
  value: (p) => (p.performance / p.price) * 10000,
  better: "higher",
};

const powerRow: SpecRow = {
  key: "power",
  label: "Power Draw",
  format: (p) => `${p.power} W`,
  value: (p) => p.power,
  better: "lower",
};

export const SPEC_ROWS: Record<CategoryId, SpecRow[]> = {
  cpu: [
    priceRow,
    performanceRow,
    ratingRow,
    {
      key: "cores",
      label: "Cores",
      format: (p) => String(p.category === "cpu" ? p.cores : "—"),
      value: (p) => (p.category === "cpu" ? p.cores : null),
      better: "higher",
    },
    {
      key: "threads",
      label: "Threads",
      format: (p) => String(p.category === "cpu" ? p.threads : "—"),
      value: (p) => (p.category === "cpu" ? p.threads : null),
      better: "higher",
    },
    {
      key: "clock",
      label: "Clock Speed",
      format: (p) =>
        p.category === "cpu" ? `${p.baseClock} – ${p.boostClock} GHz` : "—",
      value: (p) => (p.category === "cpu" ? p.boostClock : null),
      better: "higher",
    },
    {
      key: "socket",
      label: "Socket",
      format: (p) => (p.category === "cpu" ? p.socket : "—"),
      better: "none",
    },
    {
      key: "architecture",
      label: "Architecture",
      format: (p) => (p.category === "cpu" ? p.architecture : "—"),
      better: "none",
    },
    {
      key: "igpu",
      label: "Integrated Graphics",
      format: (p) =>
        p.category === "cpu" ? (p.integratedGraphics ? "Yes" : "No") : "—",
      better: "none",
    },
    powerRow,
    valueRow,
  ],
  gpu: [
    priceRow,
    performanceRow,
    ratingRow,
    {
      key: "vram",
      label: "VRAM",
      format: (p) => (p.category === "gpu" ? `${p.vram} GB` : "—"),
      value: (p) => (p.category === "gpu" ? p.vram : null),
      better: "higher",
    },
    {
      key: "memory",
      label: "Memory Type",
      format: (p) => (p.category === "gpu" ? p.memoryType : "—"),
      better: "none",
    },
    {
      key: "architecture",
      label: "Architecture",
      format: (p) => (p.category === "gpu" ? p.architecture : "—"),
      better: "none",
    },
    {
      key: "interface",
      label: "Interface",
      format: (p) => (p.category === "gpu" ? p.interface : "—"),
      better: "none",
    },
    {
      key: "length",
      label: "Length",
      format: (p) => (p.category === "gpu" ? `${p.length} mm` : "—"),
      value: (p) => (p.category === "gpu" ? p.length : null),
      better: "lower",
    },
    powerRow,
    {
      key: "psu",
      label: "Recommended PSU",
      format: (p) => (p.category === "gpu" ? `${p.recommendedPsu} W` : "—"),
      value: (p) => (p.category === "gpu" ? p.recommendedPsu : null),
      better: "lower",
    },
    valueRow,
  ],
  motherboard: [
    priceRow,
    ratingRow,
    {
      key: "socket",
      label: "Socket",
      format: (p) => (p.category === "motherboard" ? p.socket : "—"),
      better: "none",
    },
    {
      key: "chipset",
      label: "Chipset",
      format: (p) => (p.category === "motherboard" ? p.chipset : "—"),
      better: "none",
    },
    {
      key: "formFactor",
      label: "Form Factor",
      format: (p) => (p.category === "motherboard" ? p.formFactor : "—"),
      better: "none",
    },
    {
      key: "memoryType",
      label: "Memory",
      format: (p) =>
        p.category === "motherboard"
          ? `${p.memoryType} · ${p.memorySlots} slots · ${p.maxMemory}GB max`
          : "—",
      value: (p) => (p.category === "motherboard" ? p.maxMemory : null),
      better: "higher",
    },
    {
      key: "wifi",
      label: "Wi-Fi",
      format: (p) =>
        p.category === "motherboard" ? (p.wifi ? "Included" : "None") : "—",
      better: "none",
    },
    powerRow,
  ],
  ram: [
    priceRow,
    performanceRow,
    ratingRow,
    {
      key: "memoryType",
      label: "Memory",
      format: (p) => (p.category === "ram" ? p.memoryType : "—"),
      better: "none",
    },
    {
      key: "capacity",
      label: "Capacity",
      format: (p) => (p.category === "ram" ? `${p.capacity} GB` : "—"),
      value: (p) => (p.category === "ram" ? p.capacity : null),
      better: "higher",
    },
    {
      key: "speed",
      label: "Clock Speed",
      format: (p) => (p.category === "ram" ? `${p.speed} MT/s` : "—"),
      value: (p) => (p.category === "ram" ? p.speed : null),
      better: "higher",
    },
    {
      key: "cl",
      label: "CAS Latency",
      format: (p) => (p.category === "ram" ? `CL${p.casLatency}` : "—"),
      value: (p) => (p.category === "ram" ? p.casLatency : null),
      better: "lower",
    },
    {
      key: "modules",
      label: "Modules",
      format: (p) => (p.category === "ram" ? p.modules : "—"),
      better: "none",
    },
    powerRow,
    valueRow,
  ],
  storage: [
    priceRow,
    performanceRow,
    ratingRow,
    {
      key: "capacity",
      label: "Capacity",
      format: (p) =>
        p.category === "storage"
          ? p.capacity >= 1000
            ? `${p.capacity / 1000} TB`
            : `${p.capacity} GB`
          : "—",
      value: (p) => (p.category === "storage" ? p.capacity : null),
      better: "higher",
    },
    {
      key: "read",
      label: "Sequential Read",
      format: (p) => (p.category === "storage" ? `${p.readSpeed} MB/s` : "—"),
      value: (p) => (p.category === "storage" ? p.readSpeed : null),
      better: "higher",
    },
    {
      key: "interface",
      label: "Interface",
      format: (p) => (p.category === "storage" ? p.interface : "—"),
      better: "none",
    },
    {
      key: "driveType",
      label: "Drive Type",
      format: (p) => (p.category === "storage" ? p.driveType : "—"),
      better: "none",
    },
    {
      key: "formFactor",
      label: "Form Factor",
      format: (p) => (p.category === "storage" ? p.formFactor : "—"),
      better: "none",
    },
    powerRow,
  ],
  psu: [
    priceRow,
    ratingRow,
    {
      key: "wattage",
      label: "Wattage",
      format: (p) => (p.category === "psu" ? `${p.wattage} W` : "—"),
      value: (p) => (p.category === "psu" ? p.wattage : null),
      better: "higher",
    },
    {
      key: "efficiency",
      label: "Efficiency",
      format: (p) => (p.category === "psu" ? p.efficiency : "—"),
      better: "none",
    },
    {
      key: "modular",
      label: "Cabling",
      format: (p) => (p.category === "psu" ? p.modular : "—"),
      better: "none",
    },
    {
      key: "formFactor",
      label: "Form Factor",
      format: (p) => (p.category === "psu" ? p.formFactor : "—"),
      better: "none",
    },
  ],
  case: [
    priceRow,
    ratingRow,
    {
      key: "formFactor",
      label: "Form Factor",
      format: (p) => (p.category === "case" ? p.formFactor : "—"),
      better: "none",
    },
    {
      key: "support",
      label: "Board Support",
      format: (p) =>
        p.category === "case" ? p.supportedFormFactors.join(" · ") : "—",
      better: "none",
    },
    {
      key: "gpu",
      label: "Max GPU Length",
      format: (p) => (p.category === "case" ? `${p.maxGpuLength} mm` : "—"),
      value: (p) => (p.category === "case" ? p.maxGpuLength : null),
      better: "higher",
    },
    {
      key: "cooler",
      label: "Max Cooler Height",
      format: (p) => (p.category === "case" ? `${p.maxCoolerHeight} mm` : "—"),
      value: (p) => (p.category === "case" ? p.maxCoolerHeight : null),
      better: "higher",
    },
    {
      key: "radiator",
      label: "Radiator Support",
      format: (p) => (p.category === "case" ? p.radiatorSupport : "—"),
      better: "none",
    },
  ],
  cooler: [
    priceRow,
    performanceRow,
    ratingRow,
    {
      key: "type",
      label: "Cooling Type",
      format: (p) => (p.category === "cooler" ? p.coolerType : "—"),
      better: "none",
    },
    {
      key: "tdp",
      label: "TDP Rating",
      format: (p) => (p.category === "cooler" ? `${p.tdpRating} W` : "—"),
      value: (p) => (p.category === "cooler" ? p.tdpRating : null),
      better: "higher",
    },
    {
      key: "height",
      label: "Height",
      format: (p) => (p.category === "cooler" ? `${p.height} mm` : "—"),
      value: (p) => (p.category === "cooler" ? p.height : null),
      better: "lower",
    },
    {
      key: "radiator",
      label: "Radiator",
      format: (p) => (p.category === "cooler" ? p.radiator : "—"),
      better: "none",
    },
    {
      key: "sockets",
      label: "Socket Support",
      format: (p) => (p.category === "cooler" ? p.sockets.join(" · ") : "—"),
      better: "none",
    },
    powerRow,
  ],
};

export function bestIndexes(row: SpecRow, parts: Part[]): number[] {
  if (row.better === "none" || !row.value) return [];
  const values = parts.map((p) => n(row.value?.(p)));
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return [];
  const target =
    row.better === "higher" ? Math.max(...valid) : Math.min(...valid);
  if (valid.every((v) => v === target)) return [];
  return values.reduce<number[]>((acc, v, i) => {
    if (v === target) acc.push(i);
    return acc;
  }, []);
}