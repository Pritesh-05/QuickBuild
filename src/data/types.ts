export type CategoryId =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooler"
  | "monitor"
  | "mouse"
  | "keyboard";

export type FormFactor = "ATX" | "Micro ATX" | "Mini ITX";
export type MemoryType = "DDR4" | "DDR5";

export interface BasePart {
  id: string;
  category: CategoryId;
  brand: string;
  name: string;
  price: number;
  /** 0-5 */
  rating: number;
  reviews: number;
  /** 0-100 relative index used for sorting and comparison bars */
  performance: number;
  /** 0-100 popularity index */
  popularity: number;
  /** Watts drawn under load (0 for passive parts) */
  power: number;
  /** Short one-line technical highlight shown on cards */
  highlight: string;
  accent: string;
}

export interface Cpu extends BasePart {
  category: "cpu";
  socket: string;
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  architecture: string;
  integratedGraphics: boolean;
}

export interface Gpu extends BasePart {
  category: "gpu";
  chipset: string;
  vram: number;
  memoryType: string;
  length: number;
  interface: string;
  architecture: string;
  recommendedPsu: number;
}

export interface Motherboard extends BasePart {
  category: "motherboard";
  socket: string;
  chipset: string;
  formFactor: FormFactor;
  memoryType: MemoryType;
  memorySlots: number;
  maxMemory: number;
  wifi: boolean;
}

export interface Ram extends BasePart {
  category: "ram";
  memoryType: MemoryType;
  capacity: number;
  speed: number;
  modules: string;
  casLatency: number;
  rgb: boolean;
}

export interface Storage extends BasePart {
  category: "storage";
  interface: string;
  driveType: "SSD" | "HDD";
  capacity: number;
  readSpeed: number;
  formFactor: string;
}

export interface Psu extends BasePart {
  category: "psu";
  wattage: number;
  efficiency: string;
  modular: string;
  formFactor: string;
}

export interface PcCase extends BasePart {
  category: "case";
  supportedFormFactors: FormFactor[];
  formFactor: string;
  maxGpuLength: number;
  maxCoolerHeight: number;
  radiatorSupport: string;
  temperedGlass: boolean;
}

export interface Cooler extends BasePart {
  category: "cooler";
  coolerType: "Air" | "Liquid";
  sockets: string[];
  height: number;
  tdpRating: number;
  radiator: string;
}

export interface Monitor extends BasePart {
  category: "monitor";
  size: number;
  resolution: string;
  refreshRate: number;
  panelType: string;
  responseTime: number;
}

export interface Mouse extends BasePart {
  category: "mouse";
  connection: "Wired" | "Wireless";
  sensor: string;
  dpi: number;
  buttons: number;
  weight: number;
}

export interface Keyboard extends BasePart {
  category: "keyboard";
  connection: "Wired" | "Wireless";
  switchType: string;
  layout: string;
  hotswap: boolean;
}

export type Part =
  Cpu | Gpu | Motherboard | Ram | Storage | Psu | PcCase | Cooler | Monitor | Mouse | Keyboard;

export type PartByCategory = {
  cpu: Cpu;
  gpu: Gpu;
  motherboard: Motherboard;
  ram: Ram;
  storage: Storage;
  psu: Psu;
  case: PcCase;
  cooler: Cooler;
  monitor: Monitor;
  mouse: Mouse;
  keyboard: Keyboard;
};

export type BuildState = {
  [K in CategoryId]: PartByCategory[K] | null;
};
