/** Derive today's decisions for all plots from store weather + scenario. */
"use client";

import { useEffect, useMemo, useState } from "react";
import { decideForPlot } from "@/lib/decision";
import { cropRootDepthM } from "@/lib/crops";
import { defaultSandyParams, initialSoilState } from "@/lib/soil";
import { simulateSensorStream } from "@/lib/simulator";
import { resolveTodayDate, todayWeather } from "@/lib/weather";
import { useFarmStore } from "@/store/farm-store";

export function useDecisions() {
  const plots = useFarmStore((s) => s.plots);
  const weather = useFarmStore((s) => s.weather);
  const scenario = useFarmStore((s) => s.settings.scenario);
  const [todayISO, setTodayISO] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTodayISO(resolveTodayDate());
  }, []);

  return useMemo(() => {
    if (!weather) return [];
    const day = todayWeather(weather, todayISO);
    const dayIndex = Math.max(
      0,
      weather.daily.findIndex((d) => d.date === day.date),
    );
    const sensors = simulateSensorStream(
      weather.daily.map((d) => d.date),
      scenario,
    );
    const sensor = sensors[dayIndex] ?? null;

    return plots.map((plot) => {
      const soil = initialSoilState(
        defaultSandyParams(cropRootDepthM(plot.cropId)),
        2.4,
      );
      // If sensor alive, nudge soil EC toward reading
      if (sensor?.sensorAlive) {
        soil.rootZoneECe = sensor.soilEcDsM;
      }
      const decision = decideForPlot({
        plot,
        weather: day,
        weatherLabel: weather.label,
        soil,
        sensor,
        scenario,
        dayIndex,
      });
      return { plot, decision, day, weather };
    });
  }, [plots, weather, scenario, todayISO]);
}
