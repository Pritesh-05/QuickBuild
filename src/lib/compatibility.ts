import type { BuildState, CategoryId } from "@/data/types";

export type IssueLevel = "ok" | "warning" | "error";

export interface CompatibilityIssue {
  id: string;
  level: IssueLevel;
  title: string;
  detail: string;
  parts: CategoryId[];
}

export interface CompatibilityReport {
  issues: CompatibilityIssue[];
  errors: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
  passed: CompatibilityIssue[];
  status: IssueLevel;
  /** Estimated system load in watts */
  estimatedPower: number;
  /** Recommended PSU wattage with headroom */
  recommendedPsu: number;
  totalPrice: number;
  selectedCount: number;
}

export const EMPTY_BUILD: BuildState = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  case: null,
  cooler: null,
  monitor: null,
  mouse: null,
  keyboard: null,
};

export function estimatePower(build: BuildState): number {
  const parts = Object.values(build).filter(Boolean);
  const componentDraw = parts.reduce((sum, p) => sum + (p?.power ?? 0), 0);
  // Fans, chipset and peripheral overhead
  const overhead = parts.length > 0 ? 40 : 0;
  return componentDraw + overhead;
}

export function analyzeBuild(build: BuildState): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];
  const { cpu, gpu, motherboard, ram, storage, psu, case: pcCase, cooler } = build;

  if (cpu && motherboard) {
    const ok = cpu.socket === motherboard.socket;
    issues.push({
      id: "cpu-socket",
      level: ok ? "ok" : "error",
      title: "CPU ↔ Motherboard socket",
      detail: ok
        ? `${cpu.name} matches the ${motherboard.socket} socket on ${motherboard.name}.`
        : `${cpu.name} uses ${cpu.socket}, but ${motherboard.name} has an ${motherboard.socket} socket.`,
      parts: ["cpu", "motherboard"],
    });
  }

  if (ram && motherboard) {
    const ok = ram.memoryType === motherboard.memoryType;
    issues.push({
      id: "ram-type",
      level: ok ? "ok" : "error",
      title: "Memory ↔ Motherboard",
      detail: ok
        ? `${ram.memoryType} kit is supported by ${motherboard.chipset}.`
        : `${ram.name} is ${ram.memoryType}, but ${motherboard.name} only accepts ${motherboard.memoryType}.`,
      parts: ["ram", "motherboard"],
    });

    if (ok && ram.capacity > motherboard.maxMemory) {
      issues.push({
        id: "ram-capacity",
        level: "warning",
        title: "Memory capacity above board maximum",
        detail: `${ram.capacity}GB exceeds the ${motherboard.maxMemory}GB maximum of ${motherboard.name}.`,
        parts: ["ram", "motherboard"],
      });
    }
  }

  if (motherboard && pcCase) {
    const ok = pcCase.supportedFormFactors.includes(motherboard.formFactor);
    issues.push({
      id: "board-case",
      level: ok ? "ok" : "error",
      title: "Motherboard ↔ Case form factor",
      detail: ok
        ? `${pcCase.name} accepts ${motherboard.formFactor} boards.`
        : `${pcCase.name} does not support ${motherboard.formFactor} boards (supports ${pcCase.supportedFormFactors.join(", ")}).`,
      parts: ["motherboard", "case"],
    });
  }

  if (gpu && pcCase) {
    const ok = gpu.length <= pcCase.maxGpuLength;
    const tight = ok && pcCase.maxGpuLength - gpu.length < 15;
    issues.push({
      id: "gpu-case",
      level: ok ? (tight ? "warning" : "ok") : "error",
      title: "GPU ↔ Case clearance",
      detail: ok
        ? tight
          ? `Only ${pcCase.maxGpuLength - gpu.length}mm of clearance left for ${gpu.name}.`
          : `${gpu.length}mm card fits the ${pcCase.maxGpuLength}mm limit in ${pcCase.name}.`
        : `${gpu.name} is ${gpu.length}mm long; ${pcCase.name} allows ${pcCase.maxGpuLength}mm.`,
      parts: ["gpu", "case"],
    });
  }

  if (cooler && pcCase && cooler.coolerType === "Air") {
    const ok = cooler.height <= pcCase.maxCoolerHeight;
    issues.push({
      id: "cooler-case",
      level: ok ? "ok" : "error",
      title: "Cooler ↔ Case height",
      detail: ok
        ? `${cooler.height}mm cooler fits under the ${pcCase.maxCoolerHeight}mm limit.`
        : `${cooler.name} is ${cooler.height}mm tall; ${pcCase.name} allows ${pcCase.maxCoolerHeight}mm.`,
      parts: ["cooler", "case"],
    });
  }

  if (cooler && cpu) {
    const socketOk = cooler.sockets.includes(cpu.socket);
    issues.push({
      id: "cooler-socket",
      level: socketOk ? "ok" : "error",
      title: "Cooler ↔ CPU socket",
      detail: socketOk
        ? `${cooler.name} ships with ${cpu.socket} mounting hardware.`
        : `${cooler.name} has no ${cpu.socket} mounting bracket.`,
      parts: ["cooler", "cpu"],
    });

    if (socketOk && cooler.tdpRating < cpu.power) {
      issues.push({
        id: "cooler-tdp",
        level: "warning",
        title: "Cooler may throttle the CPU",
        detail: `${cooler.name} is rated for ${cooler.tdpRating}W while ${cpu.name} draws up to ${cpu.power}W.`,
        parts: ["cooler", "cpu"],
      });
    }
  }

  const estimatedPower = estimatePower(build);
  const recommendedPsu = Math.max(
    Math.ceil((estimatedPower * 1.35) / 50) * 50,
    gpu?.recommendedPsu ?? 0,
  );

  if (psu) {
    const ok = psu.wattage >= recommendedPsu;
    const tight = !ok && psu.wattage >= estimatedPower * 1.1;
    issues.push({
      id: "psu-power",
      level: ok ? "ok" : tight ? "warning" : "error",
      title: "PSU ↔ System power",
      detail: ok
        ? `${psu.wattage}W covers the ~${estimatedPower}W load with headroom.`
        : tight
          ? `${psu.wattage}W works but leaves little headroom; ${recommendedPsu}W recommended.`
          : `${psu.wattage}W is below the ~${estimatedPower}W load. ${recommendedPsu}W recommended.`,
      parts: ["psu", "gpu", "cpu"],
    });
  }

  if (psu && pcCase && psu.formFactor === "SFX" && pcCase.formFactor !== "Small Form Factor") {
    issues.push({
      id: "psu-case",
      level: "warning",
      title: "SFX power supply in a larger case",
      detail: `${psu.name} is SFX and needs an adapter bracket for ${pcCase.name}.`,
      parts: ["psu", "case"],
    });
  }

  if (gpu && cpu && !storage) {
    // no-op: storage has no compatibility constraint in this dataset
  }

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const passed = issues.filter((i) => i.level === "ok");
  const selected = Object.values(build).filter(Boolean);

  return {
    issues,
    errors,
    warnings,
    passed,
    status: errors.length ? "error" : warnings.length ? "warning" : "ok",
    estimatedPower,
    recommendedPsu,
    totalPrice: selected.reduce((sum, p) => sum + (p?.price ?? 0), 0),
    selectedCount: selected.length,
  };
}
