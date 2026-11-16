/** FAO-56 daily crop water demand: ETc = ET0 × Kc. */
import type { CropId, CropStage } from "./crops";
import { cropKc } from "./crops";

/**
 * Crop evapotranspiration in mm/day.
 * Evidence: fao56-etc-formula
 */
export function computeETc(
  et0Mm: number,
  cropId: CropId,
  stage: CropStage = "mid",
): number {
  if (!Number.isFinite(et0Mm) || et0Mm < 0) {
    throw new Error("ET0 must be a non-negative number");
  }
  const kc = cropKc(cropId, stage);
  return et0Mm * kc;
}

/** Convert mm over an area (m²) to liters. 1 mm over 1 m² = 1 liter. */
export function mmToLiters(mm: number, areaM2: number): number {
  return mm * areaM2;
}

export function litersToMm(liters: number, areaM2: number): number {
  if (areaM2 <= 0) return 0;
  return liters / areaM2;
}
