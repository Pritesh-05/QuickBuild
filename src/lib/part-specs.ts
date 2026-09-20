import type { Part } from "@/data/types";

export interface SpecRow {
  label: string;
  value: string;
}

/**
 * Turns an installed Part into 3-4 short spec rows for the 3D hover HUD.
 * Every value comes straight off the real catalog Part object — nothing
 * here is invented or guessed.
 */
export function getPartSpecs(part: Part): SpecRow[] {
  switch (part.category) {
    case "cpu":
      return [
        { label: "CORES", value: `${part.cores}C / ${part.threads}T` },
        { label: "BOOST CLOCK", value: `${part.boostClock.toFixed(1)} GHz` },
        { label: "SOCKET", value: part.socket },
        { label: "POWER", value: `${part.power}W` },
      ];
    case "gpu":
      return [
        { label: "VRAM", value: `${part.vram} GB` },
        { label: "CHIPSET", value: part.chipset },
        { label: "POWER", value: `${part.power}W` },
        { label: "PSU REQ", value: `${part.recommendedPsu}W+` },
      ];
    case "motherboard":
      return [
        { label: "SOCKET", value: part.socket },
        { label: "CHIPSET", value: part.chipset },
        { label: "FORM FACTOR", value: part.formFactor },
        { label: "MEMORY", value: part.memoryType },
      ];
    case "ram":
      return [
        { label: "CAPACITY", value: `${part.capacity} GB` },
        { label: "SPEED", value: `${part.speed} MHz` },
        { label: "TYPE", value: part.memoryType },
        { label: "MODULES", value: part.modules },
      ];
    case "storage":
      return [
        { label: "CAPACITY", value: `${part.capacity} GB` },
        { label: "TYPE", value: part.driveType },
        { label: "READ SPEED", value: `${part.readSpeed} MB/s` },
        { label: "INTERFACE", value: part.interface },
      ];
    case "psu":
      return [
        { label: "WATTAGE", value: `${part.wattage}W` },
        { label: "EFFICIENCY", value: part.efficiency },
        { label: "MODULAR", value: part.modular },
      ];
    case "case":
      return [
        { label: "FORM FACTOR", value: part.formFactor },
        { label: "MAX GPU", value: `${part.maxGpuLength} mm` },
        { label: "RADIATOR", value: part.radiatorSupport },
      ];
    case "cooler":
      return [
        { label: "TYPE", value: part.coolerType },
        { label: "TDP RATING", value: `${part.tdpRating}W` },
        { label: "RADIATOR", value: part.radiator },
      ];
    case "monitor":
      return [
        { label: "SIZE", value: `${part.size}"` },
        { label: "RESOLUTION", value: part.resolution },
        { label: "REFRESH", value: `${part.refreshRate} Hz` },
      ];
    case "keyboard":
      return [
        { label: "SWITCH", value: part.switchType },
        { label: "LAYOUT", value: part.layout },
        { label: "CONNECTION", value: part.connection },
      ];
    case "mouse":
      return [
        { label: "SENSOR", value: part.sensor },
        { label: "DPI", value: `${part.dpi}` },
        { label: "CONNECTION", value: part.connection },
      ];
  }
}