/** Why — plain language + mini chart of root-zone salt vs crop limit. */
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDecisions } from "@/hooks/useDecisions";
import { getCrop } from "@/lib/crops";

export default function WhyPage() {
  const rows = useDecisions();
  const first = rows[0];

  const chartData =
    first != null
      ? [
          { name: "Now", ece: first.decision.rootZoneECe },
          { name: "If usual", ece: first.decision.rootZoneECe * (first.decision.saltRiskIfHabit === "high" ? 1.25 : first.decision.saltRiskIfHabit === "medium" ? 1.1 : 1.02) },
          { name: "With plan", ece: first.decision.rootZoneECe },
        ]
      : [];

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">The problem inside the problem</h2>
        <p>
          Desert growers are told to “save water”. But in sandy, salty soil,
          watering too little lets <strong>salt</strong> build in the root zone
          and kill yield. Watering too much wastes scarce water.
        </p>
        <p>
          SaltSense computes the <strong>minimum</strong> water that both meets
          today&apos;s crop demand (FAO-56) <strong>and</strong> flushes enough
          salt (FAO-29 leaching requirement).
        </p>
      </section>

      {first && (
        <section className="card-panel p-4">
          <h3 className="mb-2 text-lg font-bold">
            {getCrop(first.plot.cropId).icon} {first.plot.name}
          </h3>
          <ul className="mb-4 space-y-2 text-sm">
            {first.decision.reasons.map((r) => (
              <li key={r.text}>• {r.text}</li>
            ))}
          </ul>
          <p className="mb-2 text-sm font-bold text-muted">
            Root-zone salt vs crop limit ({first.decision.cropThresholdECe} dS/m)
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit=" dS/m" domain={[0, "auto"]} />
                <Tooltip />
                <ReferenceLine
                  y={first.decision.cropThresholdECe}
                  stroke="#c45c26"
                  strokeDasharray="4 4"
                  label="crop limit"
                />
                <Line
                  type="monotone"
                  dataKey="ece"
                  stroke="#2e86ab"
                  strokeWidth={3}
                  name="ECe"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
