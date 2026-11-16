/** Run demo — scripted ~60s story for Liwa / Al Ain farm. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFarmStore } from "@/store/farm-store";
import { useDecisions } from "@/hooks/useDecisions";
import { DecisionCard } from "@/components/DecisionCard";

const STEPS = [
  {
    title: "1 · Habit day",
    body: "Al Ain farm. Palms usually get 60 L at noon. Salt is the quiet killer — not just thirst.",
    scenario: "normal" as const,
  },
  {
    title: "2 · Our decision",
    body: "SaltSense sets the minimum water for crop demand + leaching, early morning.",
    scenario: "normal" as const,
  },
  {
    title: "3 · Heatwave hits",
    body: "ET jumps. The plan adapts — still morning, enough water, confidence stays honest.",
    scenario: "heatwave" as const,
  },
  {
    title: "4 · Well gets saltier",
    body: "Leaching share rises just enough so root-zone salt stays near the crop limit.",
    scenario: "brackish_rising" as const,
  },
  {
    title: "5 · Compare",
    body: "Open Compare for liters saved and yield protected vs the usual guess.",
    scenario: "brackish_rising" as const,
  },
];

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const setScenario = useFarmStore((s) => s.setScenario);
  const setSite = useFarmStore((s) => s.setSite);
  const resetDemoFarm = useFarmStore((s) => s.resetDemoFarm);
  const rows = useDecisions();

  useEffect(() => {
    setScenario(STEPS[step]!.scenario);
  }, [step, setScenario]);

  useEffect(() => {
    if (!playing) return;
    if (step >= STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 12000);
    return () => window.clearTimeout(t);
  }, [playing, step]);

  function start() {
    resetDemoFarm();
    setSite("al_ain");
    setStep(0);
    setPlaying(true);
  }

  const current = STEPS[step]!;
  const palm = rows.find((r) => r.plot.cropId === "date_palm") ?? rows[0];

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">Run demo</h2>
        <p className="text-sm">
          ~60 second story on a realistic Al Ain farm (Open-Meteo weather +
          simulated soil sensors).
        </p>
        <button
          type="button"
          className="touch-btn w-full bg-date text-white"
          onClick={start}
        >
          {playing ? "Playing…" : "▶ Start 60s demo"}
        </button>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={`touch-btn px-3 text-sm ${
                i === step ? "bg-green text-white" : "bg-white/80"
              }`}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <h3 className="font-black text-date">{current.title}</h3>
          <p className="mt-1 text-sm">{current.body}</p>
          {step === STEPS.length - 1 && (
            <Link
              href="/compare"
              className="touch-btn mt-3 inline-flex bg-water px-4 text-white"
            >
              Open Compare →
            </Link>
          )}
        </div>
      </section>

      {palm && step >= 1 && step <= 3 && (
        <DecisionCard plot={palm.plot} decision={palm.decision} />
      )}
    </div>
  );
}
