/** Cost page — setup cost vs water saved per season (demo assumptions). */
"use client";

import { useMemo } from "react";
import { simulateCompare } from "@/lib/decision";
import { EVIDENCE } from "@/lib/evidence";
import { simulateSensorStream } from "@/lib/simulator";
import { useFarmStore } from "@/store/farm-store";

export default function CostPage() {
  const plots = useFarmStore((s) => s.plots);
  const weather = useFarmStore((s) => s.weather);
  const plot = plots[0];

  const season = useMemo(() => {
    if (!weather || !plot) return null;
    const days = weather.daily.slice(0, 30);
    const sensors = simulateSensorStream(
      days.map((d) => d.date),
      "normal",
    );
    const series = simulateCompare(plot, days, "normal", sensors, 2.5);
    const savedL = series.reduce((s, p) => s + (p.habitWaterL - p.planWaterL), 0);
    // Scale 30-day sample to ~120-day cool-season style demo
    const seasonSavedL = savedL * 4;
    const aed = (seasonSavedL / 1000) * EVIDENCE["uae-water-cost-aed"].value;
    return { seasonSavedL, aed };
  }, [weather, plot]);

  const setup =
    EVIDENCE["cost-phone"].value +
    EVIDENCE["cost-ec-meter"].value +
    EVIDENCE["cost-soil-sensor"].value;

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">What it costs</h2>
        <p className="text-sm">
          Built for a grower who already has a phone. Optional tools stay cheap.
          Prices marked as demo assumptions.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between gap-2 border-b border-date/10 py-2">
            <span>📱 Phone you already have</span>
            <strong>{EVIDENCE["cost-phone"].value} AED</strong>
          </li>
          <li className="flex justify-between gap-2 border-b border-date/10 py-2">
            <span>🔬 Cheap EC meter (optional)</span>
            <strong>{EVIDENCE["cost-ec-meter"].value} AED</strong>
          </li>
          <li className="flex justify-between gap-2 border-b border-date/10 py-2">
            <span>📡 Soil sensor kit (optional)</span>
            <strong>{EVIDENCE["cost-soil-sensor"].value} AED</strong>
          </li>
          <li className="flex justify-between gap-2 py-2 text-lg">
            <span>Setup total</span>
            <strong className="text-date">{setup} AED</strong>
          </li>
        </ul>
        <p className="badge badge-warn">demo assumption</p>
      </section>

      {season && (
        <section className="card-panel space-y-2 p-4">
          <h3 className="text-lg font-bold">Water saved / season (demo)</h3>
          <p className="text-3xl font-black text-water">
            {Math.round(season.seasonSavedL)} L
          </p>
          <p className="text-xl font-bold text-ok">
            ≈ {season.aed.toFixed(0)} AED
          </p>
          <p className="text-xs text-muted">
            Scaled from 30-day Open-Meteo sample × 4 · water at{" "}
            {EVIDENCE["uae-water-cost-aed"].value} AED/m³ (assumption)
          </p>
          {season.aed > setup && (
            <p className="font-bold text-ok">
              Pays back optional gear within one season in this demo.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
