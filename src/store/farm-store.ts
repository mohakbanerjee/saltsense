/** Zustand store — plots, settings, logs; persisted to localStorage. */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultHabit } from "@/lib/habit";
import { makeDemoPlot } from "@/lib/decision";
import type { AppSettings, IrrigationLog, Plot } from "@/lib/types";
import type { CropId } from "@/lib/crops";
import type { WeatherBundle } from "@/lib/weather";
import { offlineWeatherSample } from "@/lib/weather";

type FarmState = {
  plots: Plot[];
  settings: AppSettings;
  logs: IrrigationLog[];
  weather: WeatherBundle | null;
  demoStep: number;
  setWeather: (w: WeatherBundle) => void;
  setSite: (site: AppSettings["site"]) => void;
  setScenario: (s: AppSettings["scenario"]) => void;
  setLocale: (l: AppSettings["locale"]) => void;
  addPlot: (input: {
    name: string;
    cropId: CropId;
    plantCount: number;
    areaM2: number;
    waterEc: number | null;
    waterEcUnknown: boolean;
  }) => void;
  removePlot: (id: string) => void;
  updateHabit: (plotId: string, amount: number, hour: number) => void;
  logDone: (plotId: string, liters: number, decided: number) => void;
  setDemoStep: (n: number) => void;
  resetDemoFarm: () => void;
};

function seedPlots(): Plot[] {
  return [
    makeDemoPlot("plot-palms", "Plot A — Palms", "date_palm", 40),
    {
      ...makeDemoPlot("plot-veg", "Plot B — Tomatoes", "tomato", 200),
      waterEc: 2.2,
    },
  ];
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      plots: seedPlots(),
      settings: {
        site: "al_ain",
        scenario: "normal",
        locale: "en",
        offlineForced: false,
      },
      logs: [],
      weather: offlineWeatherSample("al_ain"),
      demoStep: 0,
      setWeather: (w) => set({ weather: w }),
      setSite: (site) => set({ settings: { ...get().settings, site } }),
      setScenario: (scenario) =>
        set({ settings: { ...get().settings, scenario } }),
      setLocale: (locale) => set({ settings: { ...get().settings, locale } }),
      addPlot: (input) => {
        const id = `plot-${Date.now()}`;
        const plot: Plot = {
          id,
          name: input.name,
          cropId: input.cropId,
          plantCount: input.plantCount,
          areaM2: input.areaM2,
          waterEc: input.waterEc,
          waterEcUnknown: input.waterEcUnknown,
          habit: defaultHabit(input.cropId),
        };
        set({ plots: [...get().plots, plot] });
      },
      removePlot: (id) =>
        set({ plots: get().plots.filter((p) => p.id !== id) }),
      updateHabit: (plotId, amount, hour) =>
        set({
          plots: get().plots.map((p) =>
            p.id === plotId
              ? { ...p, habit: { ...p.habit, amount, hour } }
              : p,
          ),
        }),
      logDone: (plotId, liters, decided) => {
        const entry: IrrigationLog = {
          id: `log-${Date.now()}`,
          plotId,
          date: new Date().toISOString().slice(0, 10),
          liters,
          decidedLiters: decided,
          at: new Date().toISOString(),
        };
        set({ logs: [entry, ...get().logs].slice(0, 200) });
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          void import("@/lib/sync-queue").then(({ enqueue }) =>
            enqueue({ type: "irrigation_log", payload: entry }),
          );
        }
      },
      setDemoStep: (n) => set({ demoStep: n }),
      resetDemoFarm: () =>
        set({
          plots: seedPlots(),
          settings: {
            ...get().settings,
            scenario: "normal",
            site: "al_ain",
          },
          demoStep: 0,
        }),
    }),
    { name: "saltsense-farm-v1" },
  ),
);
