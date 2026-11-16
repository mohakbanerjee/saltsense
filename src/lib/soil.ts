/** Simple daily root-zone water + salt balance for sandy desert soil. */
import { EVIDENCE } from "./evidence";

export type SoilState = {
  /** Plant-available water in root zone (mm) */
  soilWaterMm: number;
  /** Root-zone electrical conductivity of saturated extract (dS/m) */
  rootZoneECe: number;
};

export type SoilParams = {
  /** Available water capacity of soil (mm per m of depth) */
  awcMmPerM: number;
  /** Effective root depth (m) */
  rootDepthM: number;
};

export type DayFlux = {
  irrigationMm: number;
  irrigationEc: number;
  etcMm: number;
};

export function defaultSandyParams(rootDepthM: number): SoilParams {
  return {
    awcMmPerM: EVIDENCE["soil-sandy-awc"].value,
    rootDepthM,
  };
}

export function fieldCapacityMm(params: SoilParams): number {
  return params.awcMmPerM * params.rootDepthM;
}

/**
 * Advance one day.
 * Water: irrigate → ET → drain above field capacity.
 * Salt: insufficient leaching (irrigation ≤ ET) concentrates salt;
 *       extra water above ET flushes toward ~0.5×ECw/LF (FAO-29 idea).
 */
export function stepSoilDay(
  state: SoilState,
  params: SoilParams,
  flux: DayFlux,
): SoilState {
  const fc = fieldCapacityMm(params);
  let water = Math.max(0, state.soilWaterMm);
  let ece = Math.max(0.1, state.rootZoneECe);
  const irr = Math.max(0, flux.irrigationMm);
  const etc = Math.max(0, flux.etcMm);
  const ecw = Math.max(0, flux.irrigationEc);

  water += irr;
  water = Math.max(0, water - etc);

  const leachMm = Math.max(0, irr - etc);
  if (leachMm > 0.05 && irr > 0) {
    const lf = Math.max(leachMm / irr, 0.02);
    // FAO-29 rearrangement: steady ECe ≈ ECw × (1/LF + 1) / 5
    const target = (ecw * (1 / lf + 1)) / 5;
    ece = ece * 0.5 + Math.min(target, 25) * 0.5;
  } else {
    // Under-irrigation: salts concentrate; brackish water still deposits salt
    const deposit = ecw * 0.05 + Math.min(0.15, etc * 0.025);
    ece = Math.min(30, ece + deposit);
  }

  if (water > fc) {
    water = fc;
  }

  return {
    soilWaterMm: Math.round(water * 100) / 100,
    rootZoneECe: Math.round(ece * 100) / 100,
  };
}

export function initialSoilState(params: SoilParams, startECe = 2.0): SoilState {
  return {
    soilWaterMm: fieldCapacityMm(params) * 0.55,
    rootZoneECe: startECe,
  };
}
