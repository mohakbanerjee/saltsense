/** Shared domain types for plots, decisions, and logs. */
import type { CropId } from "./crops";
import type { FarmSite } from "./weather";
import type { ScenarioId } from "./simulator";
import type { HabitSettings } from "./habit";

export type Plot = {
  id: string;
  name: string;
  cropId: CropId;
  /** Number of plants (0 for area-based fodder) */
  plantCount: number;
  /** Plot area in m² */
  areaM2: number;
  /** Irrigation water EC (dS/m); null = use regional default */
  waterEc: number | null;
  waterEcUnknown: boolean;
  habit: HabitSettings;
};

export type DecisionResult = {
  plotId: string;
  date: string;
  /** Liters per plant when plant-based; else null */
  litersPerPlant: number | null;
  /** Depth in mm for the plot */
  mmPerPlot: number;
  /** Total liters for the plot */
  totalLiters: number;
  bestTimeStart: string;
  bestTimeEnd: string;
  leachingShare: number;
  reasons: { text: string; evidenceIds: string[] }[];
  confidence: number;
  waterSavedVsHabitLiters: number;
  saltRiskIfHabit: "low" | "medium" | "high";
  habitLiters: number;
  habitTime: string;
  expectedYieldPct: number;
  rootZoneECe: number;
  cropThresholdECe: number;
  sensorFallback: boolean;
  dataLabels: string[];
};

export type AppSettings = {
  site: FarmSite;
  scenario: ScenarioId;
  locale: "en" | "ar";
  offlineForced: boolean;
};

export type IrrigationLog = {
  id: string;
  plotId: string;
  date: string;
  liters: number;
  decidedLiters: number;
  at: string;
};
