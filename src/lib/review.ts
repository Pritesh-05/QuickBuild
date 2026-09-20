import { CATEGORIES } from "@/data/catalog";
import type { BuildState } from "@/data/types";
import type { CompatibilityReport } from "@/lib/compatibility";

export type ReviewGrade = "excellent" | "good" | "fair" | "needs work";

export interface BuildReviewResult {
  score: number;
  grade: ReviewGrade;
  verdict: string;
  strengths: string[];
  suggestions: string[];
}

const VERDICT_BY_GRADE: Record<ReviewGrade, string> = {
  excellent: "A tight, well-balanced build with no loose ends.",
  good: "A solid build overall, with a few small things worth a look.",
  fair: "Workable, but a handful of issues are worth addressing before you buy.",
  "needs work": "This build needs some changes before it's ready to buy.",
};

function gradeForScore(score: number): ReviewGrade {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 55) return "fair";
  return "needs work";
}

/** Produces a human-readable verdict, a list of things the build gets
 * right, and a list of concrete suggestions — driven entirely by part
 * specs and the compatibility report, no guessed use-case. */
export function reviewBuild(build: BuildState, report: CompatibilityReport): BuildReviewResult {
  const strengths: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const missing = CATEGORIES.filter((c) => c.required && !build[c.id]);
  if (missing.length > 0) {
    score -= missing.length * 8;
    suggestions.push(
      `Add ${missing.length === 1 ? "a" : ""} ${missing.map((c) => c.label).join(", ")} to complete the build.`,
    );
  } else {
    strengths.push("Every required slot is filled — nothing left to pick.");
  }

  report.errors.forEach((issue) => {
    score -= 20;
    suggestions.push(`${issue.title}: ${issue.detail}`);
  });

  report.warnings.forEach((issue) => {
    score -= 8;
    suggestions.push(`${issue.title}: ${issue.detail}`);
  });

  if (report.errors.length === 0 && report.warnings.length === 0 && report.selectedCount > 0) {
    strengths.push("No compatibility conflicts — every part plays nicely together.");
  }

  const { cpu, gpu, ram, storage, psu } = build;

  if (cpu && gpu) {
    const gap = gpu.performance - cpu.performance;
    if (gap > 25) {
      score -= 6;
      suggestions.push(
        `${gpu.name} outclasses ${cpu.name} by a wide margin — a stronger CPU would let it stretch its legs.`,
      );
    } else if (gap < -25) {
      score -= 6;
      suggestions.push(
        `${cpu.name} is well ahead of ${gpu.name} — a stronger GPU would put that CPU to better use.`,
      );
    } else {
      strengths.push(`${cpu.name} and ${gpu.name} are well matched in performance tier.`);
    }
  }

  if (ram) {
    if (ram.capacity < 16) {
      score -= 5;
      suggestions.push(
        `${ram.capacity}GB of RAM is tight for modern use — 16GB+ is a safer baseline.`,
      );
    } else {
      strengths.push(
        `${ram.capacity}GB of ${ram.memoryType} gives comfortable multitasking headroom.`,
      );
    }
  }

  if (storage) {
    if (storage.driveType === "HDD") {
      score -= 5;
      suggestions.push(
        `${storage.name} is a hard drive — an NVMe/SSD boot drive would meaningfully cut load times.`,
      );
    } else {
      strengths.push(`${storage.name} keeps boot and load times snappy.`);
    }
  }

  if (psu) {
    const headroom = psu.wattage - report.estimatedPower;
    if (headroom > 250) {
      suggestions.push(
        `${psu.wattage}W is well beyond what this build draws — a lower-wattage unit would save some money without a downside.`,
      );
    }
  }

  const { monitor, keyboard, mouse } = build;
  if (monitor && keyboard && mouse) {
    strengths.push(
      "A monitor, keyboard and mouse are picked too — this is a complete, ready-to-use setup.",
    );
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = gradeForScore(score);

  return {
    score,
    grade,
    verdict: VERDICT_BY_GRADE[grade],
    strengths,
    suggestions,
  };
}
