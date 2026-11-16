/** Today — one decision card per plot. */
"use client";

import { DecisionCard } from "@/components/DecisionCard";
import { useDecisions } from "@/hooks/useDecisions";
import { useFarmStore } from "@/store/farm-store";
import { SCENARIOS } from "@/lib/simulator";
import { siteName } from "@/lib/weather";

export default function TodayPage() {
  const rows = useDecisions();
  const settings = useFarmStore((s) => s.settings);
  const setScenario = useFarmStore((s) => s.setScenario);
  const setSite = useFarmStore((s) => s.setSite);
  const weather = useFarmStore((s) => s.weather);

  return (
    <div className="space-y-4">
      <section className="card-panel p-3">
        <p className="text-sm font-semibold text-muted">
          {weather?.label ?? "loading weather…"} · {siteName(settings.site)}
        </p>
        <p className="text-xs text-muted">
          Soil stream: simulated soil sensor data
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="text-sm font-bold">
            Site{" "}
            <select
              className="touch-btn ml-1 border border-date/20 bg-white px-2"
              value={settings.site}
              onChange={(e) =>
                setSite(e.target.value as typeof settings.site)
              }
            >
              <option value="al_ain">Al Ain</option>
              <option value="liwa">Liwa</option>
              <option value="dubai">Dubai</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Scenario{" "}
            <select
              className="touch-btn ml-1 border border-date/20 bg-white px-2"
              value={settings.scenario}
              onChange={(e) =>
                setScenario(e.target.value as typeof settings.scenario)
              }
            >
              {SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nameEn}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {rows.length === 0 && (
        <p className="card-panel p-4 text-muted">Loading decisions…</p>
      )}

      {rows.map(({ plot, decision }) => (
        <DecisionCard key={plot.id} plot={plot} decision={decision} />
      ))}
    </div>
  );
}
