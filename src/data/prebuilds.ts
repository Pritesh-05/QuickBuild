import type { CategoryId } from "./types";

export interface Prebuild {
  id: string;
  name: string;
  tagline: string;
  /** Short blurb shown on the picker card. */
  description: string;
  parts: Partial<Record<CategoryId, string>>;
}

// Every part combination below was checked by hand against the compatibility
// rules in src/lib/compatibility.ts (socket, memory type, case clearance,
// cooler height/TDP, PSU headroom) — loading any of these should show a
// clean "ok" report with no warnings.
export const PREBUILDS: Prebuild[] = [
  {
    id: "starter-gaming",
    name: "Starter Gaming",
    tagline: "1080p · budget-first",
    description: "Solid 1080p performance without spending on headroom you won't use yet.",
    parts: {
      cpu: "cpu-i5-12400f",
      motherboard: "mb-b760-tomahawk-ddr4",
      ram: "ram-vengeance-lpx-16",
      gpu: "gpu-rx-6600",
      storage: "sto-sn770-1tb",
      cooler: "cool-g200p",
      case: "case-td500-mesh",
      psu: "psu-cx550m",
    },
  },
  {
    id: "1440p-gaming",
    name: "1440p Gaming",
    tagline: "AM5 · sweet spot",
    description: "A balanced AM5 build built to drive high refresh 1440p comfortably.",
    parts: {
      cpu: "cpu-r5-7600",
      motherboard: "mb-tuf-b650",
      ram: "ram-fury-beast-32-ddr5",
      gpu: "gpu-rtx-4070s",
      storage: "sto-sn850x-1tb",
      cooler: "cool-h100i",
      case: "case-4000d-airflow",
      psu: "psu-rm650e",
    },
  },
  {
    id: "enthusiast-4k",
    name: "Enthusiast 4K",
    tagline: "AM5 · X3D · no compromises",
    description: "Top-tier gaming CPU and GPU paired for 4K and high-refresh 1440p alike.",
    parts: {
      cpu: "cpu-r7-7800x3d",
      motherboard: "mb-x670e-aorus",
      ram: "ram-vengeance-rgb-32-ddr5",
      gpu: "gpu-rtx-4080s",
      storage: "sto-990-pro-2tb",
      cooler: "cool-h150i",
      case: "case-7000d",
      psu: "psu-mag-a850gl",
    },
  },
  {
    id: "content-creator",
    name: "Content Creator",
    tagline: "Intel · 64GB · heavy multitasking",
    description: "High core count and 64GB of RAM for rendering, editing, and virtualization.",
    parts: {
      cpu: "cpu-i9-14900k",
      motherboard: "mb-z790-aorus-elite",
      ram: "ram-vengeance-64-ddr5",
      gpu: "gpu-rtx-4070s",
      storage: "sto-990-pro-2tb",
      cooler: "cool-ryujin-iii",
      case: "case-tuf-gt302",
      psu: "psu-rm750e",
    },
  },
  {
    id: "sff-itx",
    name: "Small Form Factor",
    tagline: "Mini ITX · 14L · desk-friendly",
    description: "A compact AM5 gaming rig that fits on a desk without giving up much power.",
    parts: {
      cpu: "cpu-r5-7600",
      motherboard: "mb-b650i-strix",
      ram: "ram-fury-beast-32-ddr5",
      gpu: "gpu-rtx-4060",
      storage: "sto-sn770-1tb",
      cooler: "cool-ml240l",
      case: "case-ncore-100",
      psu: "psu-sf750",
    },
  },
];
