import {
  Box,
  Cpu,
  Fan,
  HardDrive,
  Keyboard as KeyboardIcon,
  MemoryStick,
  Monitor as MonitorIcon,
  MonitorPlay,
  Mouse as MouseIcon,
  Plug,
  CircuitBoard,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/data/types";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  cpu: Cpu,
  gpu: MonitorPlay,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Plug,
  case: Box,
  cooler: Fan,
  monitor: MonitorIcon,
  mouse: MouseIcon,
  keyboard: KeyboardIcon,
};

export function PartIcon({ category, className }: { category: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={cn("size-4", className)} />;
}
