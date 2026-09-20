import { cpus } from "./parts/cpus";
import { gpus } from "./parts/gpus";
import { motherboards } from "./parts/motherboards";
import { rams } from "./parts/rams";
import { storages } from "./parts/storages";
import { psus } from "./parts/psus";
import { cases } from "./parts/cases";
import { coolers } from "./parts/coolers";
import { monitors } from "./parts/monitors";
import { mice } from "./parts/mice";
import { keyboards } from "./parts/keyboards";
import type { CategoryId, Part } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  shortLabel: string;
  code: string;
  description: string;
  /** Required for a build to be considered complete */
  required: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "cpu",
    label: "Processor",
    shortLabel: "CPU",
    code: "01",
    description: "Cores, threads and clock speed drive everything else.",
    required: true,
  },
  {
    id: "gpu",
    label: "Graphics Card",
    shortLabel: "GPU",
    code: "02",
    description: "Rendering power, VRAM capacity and display output.",
    required: true,
  },
  {
    id: "motherboard",
    label: "Motherboard",
    shortLabel: "MB",
    code: "03",
    description: "Socket, chipset and memory support for the platform.",
    required: true,
  },
  {
    id: "ram",
    label: "RAM",
    shortLabel: "RAM",
    code: "04",
    description: "DDR4 or DDR5 kits with capacity and frequency.",
    required: true,
  },
  {
    id: "storage",
    label: "Storage",
    shortLabel: "SSD",
    code: "05",
    description: "NVMe and SATA drives with sequential read speed.",
    required: true,
  },
  {
    id: "psu",
    label: "Power Supply",
    shortLabel: "PSU",
    code: "06",
    description: "Wattage headroom, efficiency rating and cabling.",
    required: true,
  },
  {
    id: "case",
    label: "Case",
    shortLabel: "CASE",
    code: "07",
    description: "Form factor support, clearance and airflow.",
    required: true,
  },
  {
    id: "cooler",
    label: "CPU Cooler",
    shortLabel: "COOL",
    code: "08",
    description: "Air towers and AIO liquid loops rated by TDP.",
    required: true,
  },
  {
    id: "monitor",
    label: "Monitor",
    shortLabel: "MON",
    code: "09",
    description: "Display size, resolution and refresh rate.",
    required: false,
  },
  {
    id: "keyboard",
    label: "Keyboard",
    shortLabel: "KB",
    code: "10",
    description: "Switch type, layout and connection.",
    required: false,
  },
  {
    id: "mouse",
    label: "Mouse",
    shortLabel: "MOUSE",
    code: "11",
    description: "Sensor, DPI and connection type.",
    required: false,
  },
];

export const CATALOG: Record<CategoryId, Part[]> = {
  cpu: cpus,
  gpu: gpus,
  motherboard: motherboards,
  ram: rams,
  storage: storages,
  psu: psus,
  case: cases,
  cooler: coolers,
  monitor: monitors,
  mouse: mice,
  keyboard: keyboards,
};

export const ALL_PARTS: Part[] = Object.values(CATALOG).flat();

export function getCategoryMeta(id: CategoryId): CategoryMeta {
  const meta = CATEGORIES.find((c) => c.id === id);
  if (!meta) throw new Error(`Unknown category: ${id}`);
  return meta;
}

export function getParts(category: CategoryId): Part[] {
  return CATALOG[category];
}

export function getPartById(id: string): Part | undefined {
  return ALL_PARTS.find((p) => p.id === id);
}

export function getBrands(category: CategoryId): string[] {
  return Array.from(new Set(CATALOG[category].map((p) => p.brand))).sort();
}
