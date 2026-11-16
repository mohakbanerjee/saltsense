/** Model of “the grower's guess” — fixed schedule, adjustable in settings. */
import type { CropId } from "./crops";
import { getCrop } from "./crops";
import { EVIDENCE } from "./evidence";
import { litersToMm } from "./et";

export type HabitSettings = {
  /** Liters per plant (plant crops) or mm per day (area crops) */
  amount: number;
  /** Hour of day (0–23), default noon */
  hour: number;
  usesPlants: boolean;
};

export function defaultHabit(cropId: CropId): HabitSettings {
  const crop = getCrop(cropId);
  return {
    amount: crop.usesPlants ? crop.habitLitersPerPlant : 8,
    hour: EVIDENCE["habit-noon-hour"].value,
    usesPlants: crop.usesPlants,
  };
}

/** Habit irrigation depth in mm for one day. */
export function habitIrrigationMm(
  habit: HabitSettings,
  cropId: CropId,
  plantCount: number,
  plotAreaM2: number,
): number {
  const crop = getCrop(cropId);
  if (habit.usesPlants && plantCount > 0) {
    const totalLiters = habit.amount * plantCount;
    const area = plotAreaM2 > 0 ? plotAreaM2 : plantCount * crop.canopyM2;
    return litersToMm(totalLiters, area);
  }
  return habit.amount; // already mm/day for fodder
}

export function habitLitersPerPlant(habit: HabitSettings): number {
  return habit.usesPlants ? habit.amount : 0;
}

export function formatHabitTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Fraction of applied water that reaches the root zone.
 * Noon habit loses more to evaporation than early-morning irrigation.
 */
export function irrigationDeliveryFactor(hour: number): number {
  if (hour >= 10 && hour <= 15) return 0.68; // hot midday — desert evaporation
  if (hour >= 8 && hour < 10) return 0.85;
  return 0.95; // early morning / evening
}

/** Habit mm that actually enters the soil after evaporative loss. */
export function habitEffectiveMm(
  habit: HabitSettings,
  cropId: CropId,
  plantCount: number,
  plotAreaM2: number,
): number {
  return (
    habitIrrigationMm(habit, cropId, plantCount, plotAreaM2) *
    irrigationDeliveryFactor(habit.hour)
  );
}
