/** THE PROOF — habit vs plan over 30/90 days with real cached weather. */
"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { simulateCompare } from "@/lib/decision";
import { getCrop } from "@/lib/crops";
import { EVIDENCE } from "@/lib/evidence";
import { cropSaltLimit } from "@/lib/salinity";
import { SCENARIOS, simulateSensorStream } from "@/lib/simulator";
import { useFarmStore } from "@/store/farm-store";

export default function ComparePage() {
  const plots = useFarmStore((s) => s.plots);
  const weather = useFarmStore((s) => s.weather);
  const scenario = useFarmStore((s) => s.settings.scenario);
  const setScenario = useFarmStore((s) => s.setScenario);
  const [days, setDays] = useState<30 | 90>(30);
  const [plotId, setPlotId] = useState(plots[0]?.id ?? "");

  const plot = plots.find((p) => p.id === plotId) ?? plots[0];

  const series = useMemo(() => {
    if (!weather || !plot) return [];
    const slice = weather.daily.slice(0, Math.min(days, weather.daily.length));
    // If asking 90 but sample is ~37, repeat with slight noise for demo length
    const extended =
      days > slice.length
        ? Array.from({ length: days }, (_, i) => slice[i % slice.length]!).map(
            (d, i) => ({ ...d, date: `d${i + 1}` }),
          )
        : slice;
    const sensors = simulateSensorStream(
      extended.map((d) => d.date),
      scenario,
    );
    return simulateCompare(plot, extended, scenario, sensors, 2.5);
  }, [weather, plot, days, scenario]);

  const totals = useMemo(() => {
    const planL = series.reduce((s, p) => s + p.planWaterL, 0);
    const habitL = series.reduce((s, p) => s + p.habitWaterL, 0);
    const savedL = habitL - planL;
    const aedPerM3 = EVIDENCE["uae-water-cost-aed"].value;
    const savedAed = (savedL / 1000) * aedPerM3;
    const last = series[series.length - 1];
    return { planL, habitL, savedL, savedAed, last };
  }, [series]);

  if (!plot) {
    return <p className="card-panel p-4">Add a plot first.</p>;
  }

  const threshold = cropSaltLimit(plot.cropId);
  const crop = getCrop(plot.cropId);

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">Guess vs decision</h2>
        <p className="text-sm text-muted">
          Using {weather?.label ?? "cached weather"} · soil: simulated
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            className="touch-btn border border-date/20 bg-white px-3"
            value={plot.id}
            onChange={(e) => setPlotId(e.target.value)}
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {getCrop(p.cropId).icon} {p.name}
              </option>
            ))}
          </select>
          <select
            className="touch-btn border border-date/20 bg-white px-3"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as 30 | 90)}
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <select
            className="touch-btn border border-date/20 bg-white px-3"
            value={scenario}
            onChange={(e) =>
              setScenario(e.target.value as typeof scenario)
            }
          >
            {SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Liters saved"
            value={`${Math.round(totals.savedL)} L`}
            tip={totals.savedL < 0 ? "extra for leaching" : undefined}
          />
          <Stat
            label="AED saved"
            value={`${totals.savedAed.toFixed(1)} AED`}
            tip="demo assumption"
          />
          <Stat
            label="Plan yield"
            value={`${Math.round(totals.last?.planYieldPct ?? 0)}%`}
          />
          <Stat
            label="Habit yield"
            value={`${Math.round(totals.last?.habitYieldPct ?? 0)}%`}
          />
        </div>
      </section>

      <ChartCard title={`Cumulative water — ${crop.nameEn}`}>
        <LineChart
          data={series.map((p, i) => ({
            i: i + 1,
            plan: Math.round(
              series.slice(0, i + 1).reduce((s, x) => s + x.planWaterL, 0),
            ),
            habit: Math.round(
              series.slice(0, i + 1).reduce((s, x) => s + x.habitWaterL, 0),
            ),
          }))}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="i" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="plan" stroke="#2f6b4f" strokeWidth={3} name="Our plan" dot={false} />
          <Line type="monotone" dataKey="habit" stroke="#c45c26" strokeWidth={3} name="Your usual" dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title={`Root-zone salt vs ${threshold} dS/m limit`}>
        <LineChart data={series.map((p, i) => ({ i: i + 1, plan: p.planECe, habit: p.habitECe }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="i" />
          <YAxis />
          <Tooltip />
          <Legend />
          <ReferenceLine y={threshold} stroke="#9b2c2c" strokeDasharray="4 4" label="limit" />
          <Line type="monotone" dataKey="plan" stroke="#2e86ab" strokeWidth={3} name="Plan ECe" dot={false} />
          <Line type="monotone" dataKey="habit" stroke="#c45c26" strokeWidth={3} name="Habit ECe" dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Projected yield %">
        <LineChart
          data={series.map((p, i) => ({
            i: i + 1,
            plan: p.planYieldPct,
            habit: p.habitYieldPct,
          }))}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="i" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="plan" stroke="#2f6b4f" strokeWidth={3} name="Plan" dot={false} />
          <Line type="monotone" dataKey="habit" stroke="#c45c26" strokeWidth={3} name="Habit" dot={false} />
        </LineChart>
      </ChartCard>
    </div>
  );
}

function Stat({
  label,
  value,
  tip,
}: {
  label: string;
  value: string;
  tip?: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="text-lg font-black text-date">{value}</p>
      {tip && <p className="text-[0.65rem] text-warn">{tip}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <section className="card-panel p-4">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
