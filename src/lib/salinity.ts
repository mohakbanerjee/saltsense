/** FAO-29 salt tolerance, leaching requirement, and yield from root-zone ECe. */
import type { CropId } from "./crops";
import { cropEceThreshold, cropSlope } from "./crops";
import { EVIDENCE } from "./evidence";

/**
 * Leaching requirement fraction.
 * LR = ECw / (5 × ECe_target − ECw)
 * Evidence: fao29-lr-formula
 */
export function leachingRequirement(ecw: number, eceTarget: number): number {
  if (ecw < 0 || eceTarget <= 0) {
    throw new Error("Invalid ECw or ECe target");
  }
  const denom = 5 * eceTarget - ecw;
  if (denom <= 0) {
    // Water too salty relative to crop — need max practical leaching
    return 0.5;
  }
  const lr = ecw / denom;
  return Math.min(Math.max(lr, 0), 0.5);
}

export function leachingRequirementForCrop(ecw: number, cropId: CropId): number {
  return leachingRequirement(ecw, cropEceThreshold(cropId));
}

/**
 * Expected relative yield % from root-zone ECe (piecewise linear Maas–Hoffman).
 * Y = 100 − slope × (ECe − threshold) when above threshold; floored at 0.
 */
export function expectedYieldPercent(ece: number, cropId: CropId): number {
  const threshold = cropEceThreshold(cropId);
  const slope = cropSlope(cropId);
  if (ece <= threshold) return 100;
  const loss = slope * (ece - threshold);
  return Math.max(0, Math.min(100, 100 - loss));
}

/** Applied water needed so that (1 − LR) of applied meets ETc: AW = ETc / (1 − LR). */
export function appliedWaterMm(etcMm: number, lr: number): number {
  const safeLr = Math.min(Math.max(lr, 0), 0.49);
  return etcMm / (1 - safeLr);
}

export function cropSaltLimit(cropId: CropId): number {
  return cropEceThreshold(cropId);
}

export function lrEvidenceId(): string {
  return EVIDENCE["fao29-lr-formula"].id;
}
