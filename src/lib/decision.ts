/** THE BRAIN — minimum water for crop demand + leaching; beats grower habit. */
import type { CropId } from "./crops";
import { cropRootDepthM, getCrop } from "./crops";
import { computeETc, mmToLiters } from "./et";
import { EVIDENCE } from "./evidence";
import {
  formatHabitTime,
  habitEffectiveMm,
  habitIrrigationMm,
  type HabitSettings,
} from "./habit";
import {
  appliedWaterMm,
  cropSaltLimit,
  expectedYieldPercent,
  leachingRequirementForCrop,
} from "./salinity";
import {
  defaultSandyParams,
  initialSoilState,
  stepSoilDay,
  type SoilState,
} from "./soil";
import {
  et0Multiplier,
  irrigationEcForScenario,
  type ScenarioId,
  type SensorReading,
  SENSOR_DATA_LABEL,
} from "./simulator";
import type { DecisionResult, Plot } from "./types";
import type { DailyWeather } from "./weather";

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function saltRisk(ece: number, threshold: number): "low" | "medium" | "high" {
  if (ece <= threshold) return "low";
  if (ece <= threshold * 1.35) return "medium";
  return "high";
}

export type DecisionInput = {
  plot: Plot;
  weather: DailyWeather;
  weatherLabel: string;
  soil: SoilState;
  sensor: SensorReading | null;
  scenario: ScenarioId;
  dayIndex: number;
};

export function resolveWaterEc(plot: Plot, scenario: ScenarioId, dayIndex: number): number {
  const base =
    plot.waterEcUnknown || plot.waterEc === null
      ? EVIDENCE["uae-default-well-ec"].value
      : plot.waterEc;
  return irrigationEcForScenario(scenario, dayIndex, base);
}

export function decideForPlot(input: DecisionInput): DecisionResult {
  const { plot, weather, soil, sensor, scenario, dayIndex } = input;
  const crop = getCrop(plot.cropId);
  const et0 = weather.et0Mm * et0Multiplier(scenario);
  const etc = computeETc(et0, plot.cropId);
  const ecw = resolveWaterEc(plot, scenario, dayIndex);
  // Safety buffer under crop ECe threshold so yield stays off the cliff
  const lr = leachingRequirementForCrop(ecw, plot.cropId, 0.85);
  const mmNeeded = appliedWaterMm(etc, lr);

  const area =
    plot.areaM2 > 0
      ? plot.areaM2
      : Math.max(1, plot.plantCount) * crop.canopyM2;

  const threshold = cropSaltLimit(plot.cropId);
  const safetyECe = threshold * 0.85;
  let mm = mmNeeded;
  // If salt is already near/over the safety target, or well is getting saltier,
  // push leaching harder — never trim in those cases.
  if (soil.rootZoneECe > safetyECe || scenario === "brackish_rising") {
    const boost = soil.rootZoneECe > threshold ? 1.2 : 1.12;
    mm = appliedWaterMm(etc, Math.min(0.49, lr * boost));
  }

  const totalLiters = mmToLiters(mm, area);
  const litersPerPlant =
    crop.usesPlants && plot.plantCount > 0
      ? Math.round((totalLiters / plot.plantCount) * 10) / 10
      : null;

  const habitMm = habitIrrigationMm(
    plot.habit,
    plot.cropId,
    plot.plantCount,
    area,
  );
  const habitLiters = mmToLiters(habitMm, area);

  const params = defaultSandyParams(cropRootDepthM(plot.cropId));
  const habitSoilMm = habitEffectiveMm(
    plot.habit,
    plot.cropId,
    plot.plantCount,
    area,
  );
  const afterHabit = stepSoilDay(soil, params, {
    irrigationMm: habitSoilMm,
    irrigationEc: ecw,
    etcMm: etc,
  });
  const afterPlan = stepSoilDay(soil, params, {
    irrigationMm: mm,
    irrigationEc: ecw,
    etcMm: etc,
  });

  const sensorFallback = !sensor || !sensor.sensorAlive;
  let confidence = 0.82;
  if (plot.waterEcUnknown) confidence -= 0.12;
  if (sensorFallback) confidence -= 0.18;
  if (scenario === "heatwave") confidence -= 0.05;
  confidence = Math.max(0.35, Math.min(0.95, confidence));

  const start = EVIDENCE["best-time-start"].value;
  const durationH = Math.min(2, Math.max(0.5, totalLiters / 800));

  const reasons: DecisionResult["reasons"] = [
    {
      text: `Crop needs about ${etc.toFixed(1)} mm today (ET0 ${et0.toFixed(1)} mm × Kc).`,
      evidenceIds: ["fao56-etc-formula", crop.kcEvidenceId],
    },
    {
      text: `Irrigation water EC ≈ ${ecw.toFixed(1)} dS/m → leaching share ~${(lr * 100).toFixed(0)}% targeting ~${safetyECe.toFixed(1)} dS/m (under the ${threshold} dS/m crop limit).`,
      evidenceIds: ["fao29-lr-formula", crop.eceThresholdEvidenceId],
    },
    {
      text: `Water early morning (${formatHour(start)}) so more of each liter reaches the roots vs noon habit loss.`,
      evidenceIds: ["best-time-start", "habit-noon-hour"],
    },
  ];
  if (scenario === "brackish_rising") {
    reasons.push({
      text: "Well salinity is rising — leaching boosted to protect yield.",
      evidenceIds: ["fao29-lr-formula"],
    });
  }
  if (plot.waterEcUnknown) {
    reasons.push({
      text: "Water EC unknown — using regional default (demo assumption).",
      evidenceIds: ["uae-default-well-ec"],
    });
  }
  if (sensorFallback) {
    reasons.push({
      text: "Soil sensor offline — plan uses weather + salt model; confidence lowered.",
      evidenceIds: [],
    });
  }

  const waterSaved = Math.round((habitLiters - totalLiters) * 10) / 10;

  return {
    plotId: plot.id,
    date: weather.date,
    litersPerPlant,
    mmPerPlot: Math.round(mm * 10) / 10,
    totalLiters: Math.round(totalLiters * 10) / 10,
    bestTimeStart: formatHour(start),
    bestTimeEnd: formatHour(start + durationH),
    leachingShare: Math.round(lr * 1000) / 1000,
    reasons,
    confidence: Math.round(confidence * 100) / 100,
    waterSavedVsHabitLiters: waterSaved,
    saltRiskIfHabit: saltRisk(afterHabit.rootZoneECe, threshold),
    habitLiters: Math.round(habitLiters * 10) / 10,
    habitTime: formatHabitTime(plot.habit.hour),
    expectedYieldPct: expectedYieldPercent(afterPlan.rootZoneECe, plot.cropId),
    rootZoneECe: afterPlan.rootZoneECe,
    cropThresholdECe: threshold,
    sensorFallback,
    dataLabels: [input.weatherLabel, SENSOR_DATA_LABEL],
  };
}

export type SimSeriesPoint = {
  date: string;
  planWaterL: number;
  habitWaterL: number;
  planECe: number;
  habitECe: number;
  planYieldPct: number;
  habitYieldPct: number;
  planMm: number;
  habitMm: number;
  ecw: number;
};

/** Multi-day side-by-side: habit vs plan. */
export function simulateCompare(
  plot: Plot,
  days: DailyWeather[],
  scenario: ScenarioId,
  sensors: SensorReading[],
  startECe = 2.2,
): SimSeriesPoint[] {
  const crop = getCrop(plot.cropId);
  const params = defaultSandyParams(cropRootDepthM(plot.cropId));
  let planSoil = initialSoilState(params, startECe);
  let habitSoil = initialSoilState(params, startECe);
  const area =
    plot.areaM2 > 0
      ? plot.areaM2
      : Math.max(1, plot.plantCount) * crop.canopyM2;

  return days.map((weather, dayIndex) => {
    const sensor = sensors[dayIndex] ?? null;
    const decision = decideForPlot({
      plot,
      weather,
      weatherLabel: "real weather data (Open-Meteo)",
      soil: planSoil,
      sensor,
      scenario,
      dayIndex,
    });
    const etc = computeETc(weather.et0Mm * et0Multiplier(scenario), plot.cropId);
    const ecw = resolveWaterEc(plot, scenario, dayIndex);
    const habitGrossMm = habitIrrigationMm(
      plot.habit,
      plot.cropId,
      plot.plantCount,
      area,
    );
    const habitSoilMm = habitEffectiveMm(
      plot.habit,
      plot.cropId,
      plot.plantCount,
      area,
    );

    planSoil = stepSoilDay(planSoil, params, {
      irrigationMm: decision.mmPerPlot,
      irrigationEc: ecw,
      etcMm: etc,
    });
    // Habit card still shows gross liters; soil only gets what survives noon evaporation
    habitSoil = stepSoilDay(habitSoil, params, {
      irrigationMm: habitSoilMm,
      irrigationEc: ecw,
      etcMm: etc,
    });

    return {
      date: weather.date,
      planWaterL: decision.totalLiters,
      habitWaterL: mmToLiters(habitGrossMm, area),
      planECe: planSoil.rootZoneECe,
      habitECe: habitSoil.rootZoneECe,
      planYieldPct: expectedYieldPercent(planSoil.rootZoneECe, plot.cropId),
      habitYieldPct: expectedYieldPercent(habitSoil.rootZoneECe, plot.cropId),
      planMm: decision.mmPerPlot,
      habitMm: habitGrossMm,
      ecw,
    };
  });
}

export function makeDemoPlot(
  id: string,
  name: string,
  cropId: CropId,
  plants: number,
  habit?: Partial<HabitSettings>,
): Plot {
  const crop = getCrop(cropId);
  const baseHabit = {
    amount: crop.usesPlants ? crop.habitLitersPerPlant : 8,
    hour: 12,
    usesPlants: crop.usesPlants,
    ...habit,
  };
  return {
    id,
    name,
    cropId,
    plantCount: plants,
    areaM2: plants * crop.canopyM2,
    waterEc: 2.5,
    waterEcUnknown: false,
    habit: baseHabit,
  };
}
