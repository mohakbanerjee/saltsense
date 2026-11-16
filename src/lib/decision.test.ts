/** Decision must beat habit on water and keep salt under threshold in a 30-day sim. */
import { describe, expect, it } from "vitest";
import { makeDemoPlot, simulateCompare } from "./decision";
import { simulateSensorStream } from "./simulator";
import sample from "@/data/weather-alain-sample.json";
import type { DailyWeather } from "./weather";

function sampleDays(n: number): DailyWeather[] {
  const d = sample.daily;
  return d.time.slice(0, n).map((date, i) => ({
    date,
    tempMaxC: d.temperature_2m_max[i]!,
    tempMinC: d.temperature_2m_min[i]!,
    humidityMean: d.relative_humidity_2m_mean[i]!,
    windMaxKmh: d.wind_speed_10m_max[i]!,
    radiationMj: d.shortwave_radiation_sum[i]!,
    et0Mm: d.et0_fao_evapotranspiration[i]!,
  }));
}

describe("30-day plan vs habit", () => {
  it("uses less or equal water than noon habit while protecting yield better", () => {
    const plot = makeDemoPlot("p1", "Palms", "date_palm", 20);
    // Habit overwaters: 60 L/palm at noon
    const days = sampleDays(30);
    const sensors = simulateSensorStream(
      days.map((d) => d.date),
      "normal",
    );
    const series = simulateCompare(plot, days, "normal", sensors, 2.5);

    const planWater = series.reduce((s, p) => s + p.planWaterL, 0);
    const habitWater = series.reduce((s, p) => s + p.habitWaterL, 0);
    const last = series[series.length - 1]!;
    const threshold = 4.0; // date palm ECe

    expect(planWater).toBeLessThan(habitWater);
    expect(last.planECe).toBeLessThan(threshold);
    expect(last.planYieldPct).toBeGreaterThanOrEqual(90);
  });

  it("beats stingy habit on salt when well gets saltier", () => {
    // Habit under-waters (guess too low) → salt builds; plan leaches just enough
    const plot = makeDemoPlot("p2", "Tomatoes", "tomato", 100);
    plot.habit = { amount: 0.8, hour: 12, usesPlants: true };
    plot.waterEc = 3.5;
    const days = sampleDays(30);
    const sensors = simulateSensorStream(
      days.map((d) => d.date),
      "brackish_rising",
    );
    const series = simulateCompare(plot, days, "brackish_rising", sensors, 3.2);
    const early = series[2]!;
    const late = series[28]!;
    expect(late.ecw).toBeGreaterThan(early.ecw);
    expect(late.planECe).toBeLessThan(late.habitECe);
    expect(late.planYieldPct).toBeGreaterThanOrEqual(late.habitYieldPct);
    expect(late.habitECe).toBeGreaterThan(2.5); // above tomato threshold
  });
});
